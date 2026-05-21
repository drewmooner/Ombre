"use client";

import { MorphButton } from "@/components/morph-button";
import { CartBag } from "@/components/shop/cart-bag";
import { useCart } from "@/lib/cart-context";

type CartPageViewProps = {
  signedIn: boolean;
};

export function CartPageView({ signedIn }: CartPageViewProps) {
  const { itemCount } = useCart();

  if (itemCount === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-medium">Your bag is empty</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Browse our collection and add something you love.
        </p>
        <MorphButton href="/" variant="primary" className="mt-8">
          Continue shopping
        </MorphButton>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-medium sm:text-4xl">Your bag</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>
      <CartBag showClearAll isFullPage signedIn={signedIn} />
    </div>
  );
}
