"use client";

import { useActionState } from "react";
import { logoutStoreAction, type ActionState } from "@/lib/store/actions";
import { useActionRedirect } from "./use-action-redirect";

const initial: ActionState = {};

export function LogoutButton() {
  const [state, action, pending] = useActionState(logoutStoreAction, initial);
  useActionRedirect(state, pending);

  return (
    <form action={action}>
      <button type="submit" className="store-nav-logout" disabled={pending}>
        {pending ? "…" : "Log out"}
      </button>
    </form>
  );
}
