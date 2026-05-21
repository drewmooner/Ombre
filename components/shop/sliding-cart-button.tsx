"use client";

import { CartLink } from "./cart-link";
import { useCart } from "@/lib/cart-context";

export function SlidingCartButton() {
  const { itemCount } = useCart();
  const visible = itemCount > 0;

  return (
    <CartLink
      className={`sliding-cart-btn ${visible ? "sliding-cart-btn--visible" : ""}`}
      badgeClassName="sliding-cart-badge"
      inactive={!visible}
      instantNavigate
    />
  );
}
