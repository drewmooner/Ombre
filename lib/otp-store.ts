import { createHash, randomInt } from "crypto";
import { OTP_MIN_RESEND_SECONDS } from "./otp-constants";
import { prepareDb, usesSupabase } from "./db-backend";
import * as json from "./json-data";
import { getSupabaseAdmin } from "./supabase/admin";

const OTP_TTL_MS = 10 * 60 * 1000;
const MIN_RESEND_MS = OTP_MIN_RESEND_SECONDS * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function otpSecret(): string {
  return process.env.ADMIN_SECRET ?? "ombre-otp-dev-secret";
}

function hashCode(email: string, code: string): string {
  return createHash("sha256")
    .update(`${otpSecret()}:otp:${email}:${code}`)
    .digest("hex");
}

async function pruneExpired(): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("otp_challenges")
    .delete()
    .lt("expires_at", new Date().toISOString());
  if (error) throw new Error(error.message);
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export type CreateOtpResult =
  | { ok: true; code: string }
  | { ok: false; error: string; retryAfterSeconds?: number };

export async function createOtpChallenge(emailRaw: string): Promise<CreateOtpResult> {
  const email = normalizeEmail(emailRaw);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address" };
  }

  const code = generateOtpCode();

  if (!usesSupabase()) {
    const result = await json.jsonCreateOtp(email, code);
    if (!result.ok) return result;
    return { ok: true, code };
  }

  await prepareDb();
  await pruneExpired();

  const supabase = getSupabaseAdmin();
  const { data: existing, error: findErr } = await supabase
    .from("otp_challenges")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);

  const now = Date.now();
  if (existing) {
    const lastSent = new Date(existing.last_sent_at).getTime();
    if (now - lastSent < MIN_RESEND_MS) {
      const retryAfterSeconds = Math.ceil((MIN_RESEND_MS - (now - lastSent)) / 1000);
      return {
        ok: false,
        error: `Wait ${retryAfterSeconds}s before requesting another code`,
        retryAfterSeconds,
      };
    }
  }

  const row = {
    email,
    code_hash: hashCode(email, code),
    expires_at: new Date(now + OTP_TTL_MS).toISOString(),
    last_sent_at: new Date(now).toISOString(),
    attempts: 0,
  };

  const { error } = await supabase.from("otp_challenges").upsert(row, {
    onConflict: "email",
  });
  if (error) throw new Error(error.message);
  return { ok: true, code };
}

export type VerifyOtpResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

export async function verifyOtpChallenge(
  emailRaw: string,
  codeRaw: string,
): Promise<VerifyOtpResult> {
  const email = normalizeEmail(emailRaw);
  const code = codeRaw.trim().replace(/\s/g, "");

  if (!email || !/^\d{6}$/.test(code)) {
    return { ok: false, error: "Enter the 6-digit code from your email" };
  }

  if (!usesSupabase()) return json.jsonVerifyOtp(email, code);

  await prepareDb();
  await pruneExpired();

  const supabase = getSupabaseAdmin();
  const { data: record, error: findErr } = await supabase
    .from("otp_challenges")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);

  if (!record) {
    return { ok: false, error: "Code expired or not found. Request a new one." };
  }

  if (Date.now() > new Date(record.expires_at).getTime()) {
    await supabase.from("otp_challenges").delete().eq("email", email);
    return { ok: false, error: "Code expired. Request a new one." };
  }

  if (record.attempts >= 5) {
    await supabase.from("otp_challenges").delete().eq("email", email);
    return { ok: false, error: "Too many attempts. Request a new code." };
  }

  if (record.code_hash !== hashCode(email, code)) {
    const { error } = await supabase
      .from("otp_challenges")
      .update({ attempts: record.attempts + 1 })
      .eq("email", email);
    if (error) throw new Error(error.message);
    return { ok: false, error: "Incorrect code. Try again." };
  }

  const { error: delErr } = await supabase
    .from("otp_challenges")
    .delete()
    .eq("email", email);
  if (delErr) throw new Error(delErr.message);
  return { ok: true, email };
}
