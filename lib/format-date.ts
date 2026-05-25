const ORDER_TIME_ZONE = "Africa/Lagos";

export function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ORDER_TIME_ZONE,
  }).format(new Date(iso));
}

export function formatPaymentDeadline(iso: string): string {
  return `${new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: ORDER_TIME_ZONE,
  }).format(new Date(iso))} (Nigeria time)`;
}
