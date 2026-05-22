"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { BrandLogo } from "@/components/brand-logo";
import { MorphButton } from "@/components/morph-button";

type CheckoutCompleteClientProps = {
  success: boolean;
  message: string;
};

export function CheckoutCompleteClient({
  success,
  message,
}: CheckoutCompleteClientProps) {
  const { clearCart } = useCart();
  const router = useRouter();

  useLayoutEffect(() => {
    clearCart();
    if (success) router.refresh();
  }, [success, clearCart, router]);

  return (
    <div className="morph-surface mx-auto max-w-lg rounded-2xl px-6 py-12 text-center">
      <BrandLogo size="checkout" className="mx-auto mb-6" />
      <h1 className="font-display text-2xl font-medium">
        {success ? "Payment received" : "Payment issue"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{message}</p>
      <div className="mt-8 flex flex-col gap-3">
        {success ? (
          <MorphButton href="/account/orders" variant="primary">
            Order history
          </MorphButton>
        ) : null}
        <MorphButton href="/cart">{success ? "Continue shopping" : "Back to bag"}</MorphButton>
      </div>
    </div>
  );
}
