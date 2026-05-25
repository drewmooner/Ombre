"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { BrandLogo } from "@/components/brand-logo";
import { WhatsAppIcon } from "@/components/icons";
import { MorphButton } from "@/components/morph-button";
import {
  buildDeliveryFeeConfirmationMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";

type CheckoutCompleteClientProps = {
  success: boolean;
  message: string;
  orderId?: string | null;
};

export function CheckoutCompleteClient({
  success,
  message,
  orderId = null,
}: CheckoutCompleteClientProps) {
  const { clearCart } = useCart();
  const router = useRouter();
  const deliveryConfirmationUrl = orderId
    ? buildWhatsAppUrl(buildDeliveryFeeConfirmationMessage(orderId))
    : null;

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
      {success && orderId ? (
        <div className="mt-6 space-y-4 text-left">
          <div className="rounded-2xl border border-[rgba(var(--accent-rgb),0.12)] bg-[rgba(var(--accent-rgb),0.04)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Order ID
            </p>
            <p className="mt-2 break-all font-mono text-sm text-[var(--foreground)]">
              {orderId}
            </p>
          </div>

          <div className="rounded-2xl border border-[rgba(var(--accent-rgb),0.14)] bg-[rgba(var(--accent-rgb),0.05)] px-4 py-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Confirm delivery fee on WhatsApp
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Tap WhatsApp so we can confirm your delivery fee for this exact order.
              The message is already filled with your order ID.
            </p>
            {deliveryConfirmationUrl ? (
              <a
                href={deliveryConfirmationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="morph-btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Message us on WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="mt-8 flex flex-col gap-3">
        {success ? (
          <MorphButton href="/orders" variant="primary">
            View orders
          </MorphButton>
        ) : null}
        <MorphButton href="/cart">{success ? "Continue shopping" : "Back to bag"}</MorphButton>
      </div>
    </div>
  );
}
