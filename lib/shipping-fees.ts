import type { DeliveryMethod } from "@/lib/delivery-methods";

export const DELIVERY_FEE_CONFIRMATION_LABEL =
  "Confirmed on WhatsApp after payment";

export function shippingFeeForMethod(_method: DeliveryMethod): number {
  return 0;
}

export function formatShippingFee(_method: DeliveryMethod): string {
  return DELIVERY_FEE_CONFIRMATION_LABEL;
}

export function orderTotalNgn(subtotal: number, _method: DeliveryMethod): number {
  return Math.round(subtotal);
}
