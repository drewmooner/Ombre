"use server";

import { sendOtpEmail } from "@/lib/email/send-email";
import { createOtpChallenge, verifyOtpChallenge } from "@/lib/otp-store";
import { OTP_MIN_RESEND_SECONDS } from "@/lib/otp-constants";
import { assertRateLimit } from "@/lib/security/assert-rate-limit";
import {
  normalizeOtpCode,
  normalizeRedirectPath,
  normalizeShopEmail,
} from "@/lib/security/validators";
import { createShopSession, destroyShopSession } from "@/lib/shop-auth";
import { findOrCreateShopUser } from "@/lib/shop-user-store";
import type { FormActionState } from "@/lib/form-action-state";

export type ShopAuthState = FormActionState;

export async function requestShopOtp(
  _prev: ShopAuthState,
  formData: FormData,
): Promise<ShopAuthState> {
  const limited = await assertRateLimit("shop-otp-request", {
    max: 8,
    windowMs: 15 * 60_000,
  });
  if (!limited.ok) return { error: limited.error };

  const emailNorm = normalizeShopEmail(String(formData.get("email") ?? ""));
  if (!emailNorm) {
    return { error: "Enter a valid email address" };
  }

  const isResend = String(formData.get("intent") ?? "") === "resend";

  const created = await createOtpChallenge(emailNorm);
  if (!created.ok) {
    if (created.retryAfterSeconds != null) {
      return {
        error: created.error,
        email: emailNorm,
        otpSent: true,
        resendCooldownSeconds: created.retryAfterSeconds,
      };
    }
    return { error: created.error, email: emailNorm };
  }

  const sent = await sendOtpEmail(emailNorm, created.code);
  if (!sent.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[otp] Dev fallback code for ${emailNorm}: ${created.code}`);
      const hint = sent.error.includes("RESEND_API_KEY")
        ? sent.error
        : `${sent.error} — check .env and restart the dev server.`;
      return {
        success: `Email could not be sent (${hint}) For now, use this code: ${created.code}`,
        otpSent: true,
        email: emailNorm,
        otpResent: isResend,
        resendCooldownSeconds: OTP_MIN_RESEND_SECONDS,
      };
    }
    return {
      error: sent.error || "Could not send email. Try again later.",
      email: emailNorm,
      resendCooldownSeconds: OTP_MIN_RESEND_SECONDS,
    };
  }

  return {
    success: isResend
      ? "We sent you a fresh code."
      : "We sent a 6-digit code to your email.",
    otpSent: true,
    email: emailNorm,
    otpResent: isResend,
    resendCooldownSeconds: OTP_MIN_RESEND_SECONDS,
  };
}

export async function verifyShopOtp(
  _prev: ShopAuthState,
  formData: FormData,
): Promise<ShopAuthState> {
  const limited = await assertRateLimit("shop-otp-verify", {
    max: 30,
    windowMs: 15 * 60_000,
  });
  if (!limited.ok) return { error: limited.error };

  const emailNorm = normalizeShopEmail(String(formData.get("email") ?? ""));
  const code = normalizeOtpCode(String(formData.get("code") ?? ""));

  if (!emailNorm) {
    return { error: "Enter a valid email address" };
  }
  if (!code) {
    return {
      error: "Enter the 6-digit code from your email",
      otpSent: true,
      email: emailNorm,
    };
  }

  const verified = await verifyOtpChallenge(emailNorm, code);
  if (!verified.ok) {
    return {
      error: verified.error,
      otpSent: true,
      email: emailNorm,
    };
  }

  const user = await findOrCreateShopUser(verified.email);
  await createShopSession(user.id);

  const redirectTo = normalizeRedirectPath(
    String(formData.get("redirectTo") ?? ""),
  );

  return { redirectTo };
}

/** Shop customer log out (called from useActionState — no form body). */
export async function logoutShopCustomer(
  prev: ShopAuthState = {},
): Promise<ShopAuthState> {
  void prev;
  await destroyShopSession();
  return { redirectTo: "/" };
}
