export type DeliveryMethod = "doorstep" | "park";

export const DELIVERY_METHOD_OPTIONS: {
  value: DeliveryMethod;
  title: string;
  description: string;
}[] = [
  {
    value: "doorstep",
    title: "Door step",
    description: "Delivery within Akwa Ibom — to your address.",
  },
  {
    value: "park",
    title: "Park",
    description: "Outside Akwa Ibom — pick-up at a motor park or agreed hub.",
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
