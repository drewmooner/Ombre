import type { DeliveryMethod } from "@/lib/delivery-methods";
import { formatNaira } from "@/lib/format-price";

/** Fixed delivery fees (NGN). */
export const SHIPPING_FEE_NGN: Record<DeliveryMethod, number> = {
  doorstep: 1500,
  park: 5000,
};

export function shippingFeeForMethod(method: DeliveryMethod): number {
  return SHIPPING_FEE_NGN[method];
}

export function formatShippingFee(method: DeliveryMethod): string {
  return formatNaira(SHIPPING_FEE_NGN[method]);
}

export function orderTotalNgn(subtotal: number, method: DeliveryMethod): number {
  return Math.round(subtotal) + shippingFeeForMethod(method);
}
