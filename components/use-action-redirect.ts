"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import type { FormActionState } from "@/lib/form-action-state";

export function isRedirectErrorMessage(message: string | undefined): boolean {
  if (!message) return false;
  return message.includes("NEXT_REDIRECT") || message === "Redirect";
}

/**
 * Navigate when a server action returns `redirectTo`.
 * Uses useLayoutEffect so navigation runs before other useEffect hooks
 * (e.g. router.refresh()) that would clear useActionState.
 */
export function useActionRedirect(
  state: FormActionState,
  pending: boolean,
  afterRedirect?: () => void,
) {
  const router = useRouter();
  const handledRef = useRef(false);
  const afterRedirectRef = useRef(afterRedirect);
  afterRedirectRef.current = afterRedirect;

  useLayoutEffect(() => {
    if (pending) handledRef.current = false;
  }, [pending]);

  useLayoutEffect(() => {
    const target = state.redirectTo;
    if (!target || pending || handledRef.current) return;
    handledRef.current = true;
    router.push(target);
    router.refresh();
    afterRedirectRef.current?.();
  }, [state.redirectTo, pending, router]);
}
