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
import { HeaderIconLabel } from "@/components/shop/header-icon-label";
import { firstNameFromEmail } from "@/lib/shop/display-name";
import type { ShopCustomer } from "@/lib/shop-types";
import { logoutShopCustomer } from "@/lib/shop/actions";
import { useActionRedirect } from "@/components/use-action-redirect";

type HeaderAuthProps = {
  customer: ShopCustomer | null;
};

const VIEWPORT_MARGIN = 12;
const MENU_GAP = 8;
const MENU_MAX_WIDTH = 256;

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

function clampMenuPosition(
  trigger: DOMRect,
  menuWidth: number,
  menuHeight: number,
): MenuPosition {
  const maxWidth = Math.min(
    MENU_MAX_WIDTH,
    window.innerWidth - VIEWPORT_MARGIN * 2,
  );
  const width = Math.min(menuWidth, maxWidth);

  let left =
    window.innerWidth < 640
      ? trigger.left + trigger.width / 2 - width / 2
      : trigger.right - width;

  left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(left, window.innerWidth - width - VIEWPORT_MARGIN),
  );

  let top = trigger.bottom + MENU_GAP;
  if (top + menuHeight > window.innerHeight - VIEWPORT_MARGIN) {
    top = Math.max(VIEWPORT_MARGIN, trigger.top - menuHeight - MENU_GAP);
  }

  return { top, left, width };
}

export function HeaderAuth({ customer }: HeaderAuthProps) {
  const [state, action, pending] = useActionState(logoutShopCustomer, {});
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition>({
    top: 0,
    left: 0,
    width: MENU_MAX_WIDTH,
  });
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useActionRedirect(state, pending, () => setOpen(false));

  useEffect(() => setMounted(true), []);

  function updateMenuPosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 108;
    setMenuPos(clampMenuPosition(rect, MENU_MAX_WIDTH, menuHeight));
  }

  useLayoutEffect(() => {
    if (!open) return;

    function measure() {
      updateMenuPosition();
    }

    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
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
        className="site-header-sign-in morph-btn shrink-0 rounded-full px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--accent)] sm:px-3 sm:py-2 sm:text-sm"
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
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label="Account"
            className="account-menu-panel"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
            }}
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
          className="morph-btn site-header-action site-header-action--account"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          aria-label={`Account menu for ${firstName}`}
        >
          <HeaderIconLabel label="Account">
            <UserIcon className="h-5 w-5" />
          </HeaderIconLabel>
        </button>
      </div>
      {menu}
    </>
  );
}
