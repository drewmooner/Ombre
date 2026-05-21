"use client";

import { useRouter } from "next/navigation";
import type { FormActionState } from "@/lib/form-action-state";
import { useActionSuccess } from "@/components/use-action-success";

export function isRedirectErrorMessage(message: string | undefined): boolean {
  if (!message) return false;
  return message.includes("NEXT_REDIRECT") || message === "Redirect";
}

/** Navigate when the server action returns `redirectTo` (never use server redirect() with useActionState). */
export function useActionRedirect(
  state: FormActionState,
  pending: boolean,
  afterRedirect?: () => void,
) {
  const router = useRouter();

  useActionSuccess(state.redirectTo, pending, () => {
    if (!state.redirectTo) return;
    router.push(state.redirectTo);
    router.refresh();
    afterRedirect?.();
  });
}
