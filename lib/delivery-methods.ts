import { SHIPPING_FEE_NGN } from "@/lib/shipping-fees";

export type DeliveryMethod = "doorstep" | "park";

export const DELIVERY_METHOD_OPTIONS: {
  value: DeliveryMethod;
  title: string;
  description: string;
  feeNgn: number;
}[] = [
  {
    value: "doorstep",
    title: "Door step",
    description: "Delivery within Akwa Ibom — to your address.",
    feeNgn: SHIPPING_FEE_NGN.doorstep,
  },
  {
    value: "park",
    title: "Park",
    description: "Outside Akwa Ibom — pick-up at a motor park or agreed hub.",
    feeNgn: SHIPPING_FEE_NGN.park,
  },
];

export function deliveryMethodLabel(method: DeliveryMethod): string {
  return DELIVERY_METHOD_OPTIONS.find((o) => o.value === method)?.title ?? method;
}

export function isAkwaIbomState(state: string): boolean {
  const normalized = state.trim().toLowerCase().replace(/\s+/g, " ");
  return (
    normalized === "akwa ibom" ||
    normalized === "akwa-ibom" ||
    normalized.startsWith("akwa ibom")
  );
}

export function parseDeliveryMethod(raw: string): DeliveryMethod | null {
  if (raw === "doorstep" || raw === "park") return raw;
  return null;
}
