import { redirectToCheckoutComplete } from "@/lib/checkout/redirect-to-complete";

type PaymentCompleteRedirectProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentCompleteRedirectPage({
  searchParams,
}: PaymentCompleteRedirectProps) {
  return redirectToCheckoutComplete(searchParams);
}
