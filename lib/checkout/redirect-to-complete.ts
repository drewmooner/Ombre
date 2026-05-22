import { redirect } from "next/navigation";

export async function redirectToCheckoutComplete(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<never> {
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
