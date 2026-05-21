"use client";

import { useEffect, useRef } from "react";

/** Run `onSuccess` once per action success; reset when a new action starts (pending). */
export function useActionSuccess(
  success: string | undefined,
  pending: boolean,
  onSuccess: () => void,
) {
  const handledRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (pending) handledRef.current = false;
  }, [pending]);

  useEffect(() => {
    if (!success || handledRef.current) return;
    handledRef.current = true;
    onSuccessRef.current();
  }, [success, pending]);
}
