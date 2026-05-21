"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartIcon } from "@/components/icons";
import { useCart } from "@/lib/cart-context";

type CartLinkProps = {
  className: string;
  badgeClassName?: string;
  /** Off-screen control (side cart when empty) */
  inactive?: boolean;
  /** Navigate on press (side cart — avoids tap delay) */
  instantNavigate?: boolean;
};

export function CartLink({
  className,
  badgeClassName,
  inactive = false,
  instantNavigate = false,
}: CartLinkProps) {
  const { itemCount } = useCart();
  const router = useRouter();

  function goToCart() {
    if (!inactive) router.push("/cart");
  }

  return (
    <Link
      href="/cart"
      prefetch
      className={className}
      aria-label={`Your bag${itemCount > 0 ? `, ${itemCount} items` : ""}`}
      aria-hidden={inactive}
      tabIndex={inactive ? -1 : undefined}
      onPointerDown={
        instantNavigate
          ? (e) => {
              if (inactive || e.button !== 0) return;
              e.preventDefault();
              goToCart();
            }
          : undefined
      }
      onClick={
        instantNavigate
          ? (e) => {
              e.preventDefault();
            }
          : undefined
      }
    >
      <CartIcon className="h-5 w-5" />
      {itemCount > 0 && (
        <span
          className={
            badgeClassName ??
            "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-[var(--on-accent)]"
          }
        >
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </Link>
  );
}
