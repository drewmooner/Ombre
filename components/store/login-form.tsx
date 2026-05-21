"use client";

import { useActionState, useState } from "react";
import { loginStore, type ActionState } from "@/lib/store/actions";
import { EyeIcon, EyeSlashIcon } from "@/components/icons";
import { BrandLogo } from "@/components/brand-logo";
import { MorphButton } from "@/components/morph-button";
import { ActionAlerts } from "./action-alerts";
import { useActionRedirect } from "./use-action-redirect";

export function StoreLoginForm() {
  const [state, action, pending] = useActionState(loginStore, {} as ActionState);
  const [showPassword, setShowPassword] = useState(false);

  useActionRedirect(state, pending);

  return (
    <form action={action} className="morph-surface mx-auto max-w-sm space-y-6 rounded-3xl p-8">
      <div className="text-center">
        <BrandLogo size="auth" className="mx-auto mb-4" />
        <h1 className="font-display text-2xl font-medium text-[var(--accent)]">Store</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Sign in to manage Ombré products.</p>
      </div>
      <ActionAlerts state={state} />
      <label className="block text-sm font-medium">
        Password
        <div className="relative mt-2">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className="morph-input w-full rounded-2xl py-2.5 pl-4 pr-11 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </label>
      <MorphButton type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </MorphButton>
    </form>
  );
}
