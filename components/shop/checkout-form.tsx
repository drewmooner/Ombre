"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import {
  DELIVERY_METHOD_OPTIONS,
  type DeliveryMethod,
} from "@/lib/delivery-methods";
import { startCheckout, type CheckoutState } from "@/lib/shop/checkout-actions";
import { NIGERIA_STATES } from "@/lib/nigeria-states";
import { formatNaira } from "@/lib/format-price";
import { MorphButton } from "@/components/morph-button";
import { useActionRedirect } from "@/components/use-action-redirect";
import { CheckoutOrderSummary } from "@/components/shop/checkout-order-summary";

type CheckoutFormProps = {
  accountEmail: string;
  paymentTimeoutMinutes: number;
  checkoutReady: boolean;
  simulateCheckout: boolean;
};

const initial: CheckoutState = {};

const inputClass =
  "checkout-input mt-2 block w-full rounded-xl border border-[rgba(var(--accent-rgb),0.22)] bg-white px-4 py-3 text-[15px] text-[var(--foreground)] shadow-[inset_0_1px_2px_rgba(20,14,16,0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted)] focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.12)]";

export function CheckoutForm({
  accountEmail,
  paymentTimeoutMinutes,
  checkoutReady,
  simulateCheckout,
}: CheckoutFormProps) {
  const { items, subtotal, itemCount, clearCart } = useCart();
  const [state, formAction, pending] = useActionState(startCheckout, initial);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("doorstep");

  const cartJson = useMemo(
    () =>
      JSON.stringify(
        items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      ),
    [items],
  );

  useActionRedirect(state, pending, () => {
    if (state.redirectTo) clearCart();
  });

  if (itemCount === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-[var(--muted)]">Your bag is empty.</p>
        <MorphButton href="/" variant="primary" className="mt-6">
          Continue shopping
        </MorphButton>
      </div>
    );
  }

  return (
    <form action={formAction} className="checkout-page space-y-8">
      <input type="hidden" name="cart" value={cartJson} />

      {state.error && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800"
          role="alert"
        >
          {state.error}
        </p>
      )}

      {!checkoutReady && (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm leading-relaxed text-amber-950">
          Set <code className="text-xs">CHECKOUT_SIMULATE_PAYMENT=true</code> in{" "}
          <code className="text-xs">.env</code> for local testing, or add Paystack
          keys and restart the dev server.
        </p>
      )}

      <section className="checkout-panel morph-surface rounded-2xl p-6 sm:p-8">
        <header className="border-b border-[rgba(var(--accent-rgb),0.1)] pb-5">
          <h2 className="font-display text-2xl font-medium tracking-tight">
            Delivery details
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Where should we send your order, and how can we reach you?
          </p>
        </header>

        <div className="mt-6 space-y-5">
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-[var(--foreground)]">
              Delivery type
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {DELIVERY_METHOD_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="checkout-delivery-option has-[:checked]:border-[rgba(var(--accent-rgb),0.4)] has-[:checked]:bg-[rgba(var(--accent-rgb),0.06)]"
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value={option.value}
                    required
                    checked={deliveryMethod === option.value}
                    onChange={() => setDeliveryMethod(option.value)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      {option.title}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="rounded-xl border border-[rgba(var(--accent-rgb),0.14)] bg-[rgba(var(--accent-rgb),0.05)] px-4 py-3 text-sm leading-relaxed text-[var(--foreground)]">
            Delivery fee is <strong>not charged at checkout</strong>. After payment,
            we’ll confirm the delivery fee with you on WhatsApp using the number you
            enter below.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="checkout-label sm:col-span-2">
              Full name
              <input
                name="fullName"
                required
                autoComplete="name"
                placeholder="As on your ID"
                className={inputClass}
              />
            </label>

            <label className="checkout-label sm:col-span-2">
              Email
              <span className="checkout-hint">
                Order updates and payment receipt
              </span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={accountEmail}
                placeholder="you@example.com"
                className={inputClass}
              />
            </label>

            <label className="checkout-label sm:col-span-2">
              Phone (WhatsApp)
              <input
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="08012345678"
                className={inputClass}
              />
            </label>

            <label className="checkout-label sm:col-span-2">
              Street address
              <input
                name="addressLine"
                required
                autoComplete="street-address"
                placeholder="House number, street, landmark"
                className={inputClass}
              />
            </label>

            <label className="checkout-label">
              City / town
              <input
                name="city"
                required
                autoComplete="address-level2"
                placeholder="Uyo"
                className={inputClass}
              />
            </label>

            <label className="checkout-label">
              State
              <select
                name="state"
                required
                defaultValue=""
                className={`${inputClass} appearance-none`}
              >
                <option value="" disabled>
                  Select state
                </option>
                {NIGERIA_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="checkout-panel morph-surface rounded-2xl p-6 sm:p-8">
        <header className="border-b border-[rgba(var(--accent-rgb),0.1)] pb-5">
          <h2 className="font-display text-2xl font-medium tracking-tight">
            Your order
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {itemCount} {itemCount === 1 ? "item" : "items"} · Nigeria (NGN)
          </p>
        </header>

        <CheckoutOrderSummary
          items={items}
          itemCount={itemCount}
          subtotal={subtotal}
          deliveryMethod={deliveryMethod}
        />

        <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
          Items stay reserved for {paymentTimeoutMinutes} minutes while you pay.
          You are paying for the items now; delivery fee will be confirmed on
          WhatsApp after payment. If payment is not completed in time, stock
          returns to the shop.
        </p>
      </section>

      <div className="checkout-actions space-y-3">
        <MorphButton
          type="submit"
          variant="primary"
          fullWidth
          disabled={pending || !checkoutReady}
          className="py-3.5 text-base"
        >
          {pending
            ? simulateCheckout
              ? "Completing test order…"
              : "Starting checkout…"
            : simulateCheckout
              ? `Place test order · ${formatNaira(subtotal)}`
              : checkoutReady
                ? `Pay ${formatNaira(subtotal)} with Paystack`
                : "Configure checkout"}
        </MorphButton>

        <MorphButton href="/cart" fullWidth className="py-3">
          Back to bag
        </MorphButton>

        <p className="text-center text-xs leading-relaxed text-[var(--muted)]">
          By placing your order you agree to our{" "}
          <Link href="/terms" className="link-accent font-medium">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="link-accent font-medium">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
