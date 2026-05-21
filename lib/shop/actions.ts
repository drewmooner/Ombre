"use server";

import { sendOtpEmail } from "@/lib/email/send-email";
import { createOtpChallenge, verifyOtpChallenge } from "@/lib/otp-store";
import { OTP_MIN_RESEND_SECONDS } from "@/lib/otp-constants";
import { createShopSession, destroyShopSession } from "@/lib/shop-auth";
import { findOrCreateShopUser } from "@/lib/shop-user-store";
import type { FormActionState } from "@/lib/form-action-state";

export type ShopAuthState = FormActionState;

export async function requestShopOtp(
  _prev: ShopAuthState,
  formData: FormData,
): Promise<ShopAuthState> {
  const email = String(formData.get("email") ?? "");
  const isResend = String(formData.get("intent") ?? "") === "resend";

  const created = await createOtpChallenge(email);
  const emailNorm = email.trim().toLowerCase();
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
  const email = String(formData.get("email") ?? "");
  const code = String(formData.get("code") ?? "");

  const verified = await verifyOtpChallenge(email, code);
  if (!verified.ok) {
    return {
      error: verified.error,
      otpSent: true,
      email: email.trim().toLowerCase(),
    };
  }

  const user = await findOrCreateShopUser(verified.email);
  await createShopSession(user.id);

  const next = String(formData.get("redirectTo") ?? "").trim();
  const redirectTo =
    next.startsWith("/") && !next.startsWith("//") ? next : "/";

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
