"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestShopOtp,
  verifyShopOtp,
  type ShopAuthState,
} from "@/lib/shop/actions";
import { OTP_MIN_RESEND_SECONDS } from "@/lib/otp-constants";
import { MorphButton } from "@/components/morph-button";
import {
  useActionRedirect,
  isRedirectErrorMessage,
} from "@/components/use-action-redirect";

const initial: ShopAuthState = {};

function bannerForState(
  otpSent: boolean,
  requestState: ShopAuthState,
  verifyState: ShopAuthState,
  suppressVerifyError: boolean,
): { type: "error" | "success"; message: string } | null {
  if (!otpSent) {
    const err = requestState.error;
    const ok = requestState.success;
    if (err && !isRedirectErrorMessage(err))
      return { type: "error", message: err };
    if (ok) return { type: "success", message: ok };
    return null;
  }

  const errReq = requestState.error;
  const errVer = suppressVerifyError ? undefined : verifyState.error;

  if (errReq && !isRedirectErrorMessage(errReq))
    return { type: "error", message: errReq };
  if (errVer && !isRedirectErrorMessage(errVer))
    return { type: "error", message: errVer };

  const ok = requestState.success ?? verifyState.success;
  if (ok) return { type: "success", message: ok };
  return null;
}

export function ShopLoginForm({
  redirectTo = "/",
  forCheckout = false,
}: {
  redirectTo?: string;
  forCheckout?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  /** After a successful resend, hide stale "wrong code" until user tries again */
  const [suppressVerifyError, setSuppressVerifyError] = useState(false);

  const [requestState, requestAction, requestPending] = useActionState(
    requestShopOtp,
    initial,
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyShopOtp,
    initial,
  );

  /* eslint-disable react-hooks/set-state-in-effect -- Sync server OTP step & cooldown flags into UI */
  useEffect(() => {
    if (requestState.otpSent) {
      setOtpSent(true);
      if (requestState.email) setEmail(requestState.email);
    }
  }, [requestState.otpSent, requestState.email]);

  useEffect(() => {
    if (
      requestState.resendCooldownSeconds != null &&
      requestState.resendCooldownSeconds > 0
    ) {
      setCooldownSec(requestState.resendCooldownSeconds);
    }
  }, [requestState.resendCooldownSeconds]);

  useEffect(() => {
    if (requestState.otpResent) setSuppressVerifyError(true);
  }, [requestState.otpResent]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const t = window.setTimeout(() => {
      setCooldownSec((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearTimeout(t);
  }, [cooldownSec]);

  useActionRedirect(verifyState, verifyPending, () => router.refresh());

  const banner = bannerForState(
    otpSent,
    requestState,
    verifyState,
    suppressVerifyError,
  );

  const displayEmail =
    email || requestState.email || verifyState.email || "";

  function cancelSignIn() {
    setOtpSent(false);
    setEmail("");
    setCooldownSec(0);
    setSuppressVerifyError(false);
    router.push("/");
  }

  return (
    <div className="morph-surface relative mx-auto max-w-sm space-y-6 rounded-3xl p-8">
      <button
        type="button"
        onClick={cancelSignIn}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--surface)] text-xl leading-none text-[var(--muted)] shadow-[var(--shadow-soft)] transition-colors hover:border-[rgba(var(--accent-rgb),0.2)] hover:text-[var(--accent)]"
        aria-label="Cancel sign in"
      >
        ×
      </button>
      <div>
        <h1 className="font-display text-2xl font-medium text-[var(--accent)] pr-8">
          {otpSent ? "Check your email" : forCheckout ? "Sign in to checkout" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {otpSent
            ? `Enter the 6-digit code we sent to ${displayEmail}`
            : forCheckout
              ? "We’ll email you a code so you can pay and get order updates."
              : "We’ll email you a one-time code. No password needed."}
        </p>
      </div>

      {banner && banner.type === "error" && (
        <p className="store-alert store-alert-error !mb-0">{banner.message}</p>
      )}
      {banner && banner.type === "success" && !verifyState.redirectTo && (
        <p className="store-alert store-alert-success !mb-0">{banner.message}</p>
      )}

      {!otpSent ? (
        <form action={requestAction} className="space-y-4">
          <label className="store-label block">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="store-input mt-2 w-full"
            />
          </label>
          <MorphButton
            type="submit"
            variant="primary"
            fullWidth
            disabled={requestPending}
          >
            {requestPending ? "Sending…" : "Send code"}
          </MorphButton>
        </form>
      ) : (
        <div className="space-y-4">
          <form
            action={verifyAction}
            className="space-y-4"
            onSubmit={() => setSuppressVerifyError(false)}
          >
            <input type="hidden" name="email" value={displayEmail} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <label className="store-label block">
              Code
              <input
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                placeholder="000000"
                className="store-input mt-2 w-full font-mono text-lg tracking-[0.35em]"
              />
            </label>
            <MorphButton
              type="submit"
              variant="primary"
              fullWidth
              disabled={verifyPending}
            >
              {verifyPending ? "Verifying…" : "Sign in"}
            </MorphButton>
          </form>

          <form action={requestAction} className="space-y-2">
            <input type="hidden" name="email" value={displayEmail} />
            <input type="hidden" name="intent" value="resend" />
            <MorphButton
              type="submit"
              variant="default"
              fullWidth
              disabled={requestPending || cooldownSec > 0}
            >
              {requestPending
                ? "Sending…"
                : cooldownSec > 0
                  ? `Resend code in ${cooldownSec}s`
                  : "Resend code"}
            </MorphButton>
            <p className="text-center text-xs text-[var(--muted)]">
              New codes limited to once every {OTP_MIN_RESEND_SECONDS} seconds so
              inboxes aren’t overloaded. Also check spam and promotions folders.
            </p>
          </form>

          <button
            type="button"
            className="w-full text-center text-sm text-[var(--muted)] hover:text-[var(--accent)]"
            onClick={() => {
              setOtpSent(false);
              setCooldownSec(0);
              setSuppressVerifyError(false);
            }}
          >
            Use a different email
          </button>
        </div>
      )}
    </div>
  );
}
