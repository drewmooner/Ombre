import { redirect } from "next/navigation";

type SuccessRedirectProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Paystack dashboards often use /checkout/success — forward to /checkout/complete. */
export default async function CheckoutSuccessRedirectPage({
  searchParams,
}: SuccessRedirectProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    }
  }
  const query = qs.toString();
  redirect(`/checkout/complete${query ? `?${query}` : ""}`);
}
