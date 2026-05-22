"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartIcon } from "@/components/icons";
import { useCart } from "@/lib/cart-context";
import { HeaderIconLabel } from "./header-icon-label";

type CartLinkProps = {
  className?: string;
  badgeClassName?: string;
  label?: string;
  /** Off-screen control (side cart when empty) */
  inactive?: boolean;
  /** Navigate on press (side cart — avoids tap delay) */
  instantNavigate?: boolean;
  /** Side tab uses a slightly smaller label */
  compactLabel?: boolean;
};

export function CartLink({
  className = "morph-btn site-header-action site-header-action--cart",
  badgeClassName,
  label = "Bag",
  inactive = false,
  instantNavigate = false,
  compactLabel = false,
}: CartLinkProps) {
  const { itemCount } = useCart();
  const router = useRouter();

  function goToCart() {
    if (!inactive) router.push("/cart");
  }

  const badgeEl =
    itemCount > 0 ? (
      <span
        className={
          badgeClassName ??
          "site-header-action__badge"
        }
      >
        {itemCount > 9 ? "9+" : itemCount}
      </span>
    ) : null;

  return (
    <Link
      href="/cart"
      prefetch
      className={className}
      aria-label={`Your ${label.toLowerCase()}${itemCount > 0 ? `, ${itemCount} items` : ""}`}
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
      <HeaderIconLabel label={label} badge={badgeEl} compact={compactLabel}>
        <CartIcon className="h-5 w-5" />
      </HeaderIconLabel>
    </Link>
  );
}
