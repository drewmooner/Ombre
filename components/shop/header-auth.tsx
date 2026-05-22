"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { UserIcon } from "@/components/icons";
import { firstNameFromEmail } from "@/lib/shop/display-name";
import type { ShopCustomer } from "@/lib/shop-types";
import { logoutShopCustomer } from "@/lib/shop/actions";
import { useActionRedirect } from "@/components/use-action-redirect";

type HeaderAuthProps = {
  customer: ShopCustomer | null;
};

type MenuPosition = {
  top: number;
  right: number;
};

export function HeaderAuth({ customer }: HeaderAuthProps) {
  const [state, action, pending] = useActionState(logoutShopCustomer, {});
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition>({ top: 0, right: 0 });
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useActionRedirect(state, pending, () => setOpen(false));

  useEffect(() => setMounted(true), []);

  function updateMenuPosition() {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 8,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, menuId]);

  if (!customer) {
    return (
      <Link
        href="/login"
        className="morph-btn shrink-0 rounded-full px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--accent)] sm:px-3 sm:py-2 sm:text-sm"
      >
        Sign in
      </Link>
    );
  }

  const firstName = firstNameFromEmail(customer.email);

  const menu =
    open && mounted
      ? createPortal(
          <div
            id={menuId}
            role="menu"
            aria-label="Account"
            className="account-menu-panel"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <p className="account-menu-email" title={customer.email}>
              {customer.email}
            </p>
            <form action={action} className="account-menu-footer">
              <button
                type="submit"
                role="menuitem"
                disabled={pending}
                className="account-menu-logout"
              >
                {pending ? "Signing out…" : "Log out"}
              </button>
            </form>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div ref={rootRef} className="shrink-0">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="morph-btn site-header-account flex h-11 w-11 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          aria-label={`Account menu for ${firstName}`}
        >
          <UserIcon className="h-5 w-5" />
        </button>
      </div>
      {menu}
    </>
  );
}
