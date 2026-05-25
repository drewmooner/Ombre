"use client";

import { ProductImage } from "@/components/shop/product-image";
import type { CartItem } from "@/lib/cart-context";
import { deliveryMethodLabel, type DeliveryMethod } from "@/lib/delivery-methods";
import { formatNaira } from "@/lib/format-price";

type CheckoutOrderSummaryProps = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryMethod: DeliveryMethod;
};

export function CheckoutOrderSummary({
  items,
  itemCount,
  subtotal,
  deliveryMethod,
}: CheckoutOrderSummaryProps) {
  return (
    <>
      <ul className="mt-6 divide-y divide-[rgba(var(--accent-rgb),0.08)]">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:gap-4"
          >
            <div className="relative h-[4.5rem] w-16 shrink-0 overflow-hidden rounded-xl border border-[rgba(var(--accent-rgb),0.1)]">
              <ProductImage
                src={item.image}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug">{item.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Quantity {item.quantity} · {formatNaira(item.price)} each
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums sm:ml-auto sm:shrink-0 sm:text-right">
              {formatNaira(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="checkout-summary mt-6 space-y-3 border-t border-[rgba(var(--accent-rgb),0.12)] pt-5">
        <div className="checkout-summary__row">
          <span className="checkout-summary__label">
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
          <span className="checkout-summary__value tabular-nums">
            {formatNaira(subtotal)}
          </span>
        </div>
        <div className="checkout-summary__row">
          <span className="checkout-summary__label">
            Delivery · {deliveryMethodLabel(deliveryMethod)}
          </span>
          <span className="checkout-summary__value text-right text-xs leading-relaxed text-[var(--muted)] sm:text-sm">
            Confirmed on WhatsApp after payment
          </span>
        </div>
        <div className="checkout-summary__row checkout-summary__row--total">
          <span className="checkout-summary__label-total">Pay now</span>
          <span className="checkout-summary__total tabular-nums">
            {formatNaira(subtotal)}
          </span>
        </div>
      </div>
    </>
  );
}
