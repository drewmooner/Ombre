/** When true, checkout skips Paystack and marks orders paid locally (dev/testing only). */
export function isCheckoutSimulateEnabled(): boolean {
  const raw = process.env.CHECKOUT_SIMULATE_PAYMENT?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function isCheckoutReady(): boolean {
  return isCheckoutSimulateEnabled() || Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());
}
