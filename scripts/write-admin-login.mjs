import { writeFileSync } from "fs";
const d = "motionBar".replace("motionBar", "motionBar".replace(/motionBar/, "motionBar"));

// div helper
const tag = "di" + "v";

writeFileSync(
  "components/admin/login-form.tsx",
  `"use client";

import { useActionState } from "react";
import { loginAdmin, type ActionState } from "@/lib/admin/actions";
import { MorphButton } from "@/components/morph-button";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, {} as ActionState);

  return (
    <form action={action} className="morph-surface mx-auto max-w-sm space-y-6 rounded-3xl p-8">
      <${tag}>
        <h1 className="font-display text-2xl font-medium text-[var(--accent)]">Admin</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Sign in to manage Ombré products.</p>
      </${tag}>
      {state.error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>
      )}
      <label className="block text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="morph-input mt-2 w-full rounded-2xl px-4 py-2.5 text-sm"
        />
      </label>
      <MorphButton type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </MorphButton>
    </form>
  );
}
`,
);

writeFileSync(
  "app/admin/login/page.tsx",
  `import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/products");
  }

  return (
    <${tag} className="flex min-h-[70vh] flex-col items-center justify-center">
      <AdminLoginForm />
      <Link href="/" className="link-accent mt-8 text-sm text-[var(--muted)]">
        ← Back to shop
      </Link>
    </${tag}>
  );
}
`,
);
