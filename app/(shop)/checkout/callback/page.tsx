import { redirectToCheckoutComplete } from "@/lib/checkout/redirect-to-complete";

type CheckoutCallbackRedirectProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutCallbackRedirectPage({
  searchParams,
}: CheckoutCallbackRedirectProps) {
  return redirectToCheckoutComplete(searchParams);
}
