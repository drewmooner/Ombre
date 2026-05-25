import Link from "next/link";
import { CheckoutCompleteClient } from "@/components/shop/checkout-complete-client";
import { fulfillOrderPayment } from "@/lib/checkout/fulfill-payment";
import { paymentReferenceFromSearchParams } from "@/lib/checkout/payment-reference";

type CompletePageProps = {
  searchParams: Promise<{
    reference?: string | string[];
    trxref?: string | string[];
  }>;
};

export default async function CheckoutCompletePage({
  searchParams,
}: CompletePageProps) {
  const params = await searchParams;
  const reference = paymentReferenceFromSearchParams(params);

  if (!reference) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-[var(--muted)]">Missing payment reference.</p>
        <Link href="/cart" className="link-accent mt-4 inline-block text-sm">
          Back to bag
        </Link>
      </div>
    );
  }

  let message: string;
  let success = false;
  let orderId: string | null = null;

  try {
    const result = await fulfillOrderPayment(reference, {
      revalidate: false,
      skipReceiptEmail: true,
    });

    success = result.ok;
    if (!result.ok) {
      message = result.error;
    } else {
      orderId = result.orderId;
      message =
        "Thank you — your payment is confirmed. We've emailed you a receipt, and your delivery fee will be confirmed with you on WhatsApp.";
    }
  } catch (e) {
    console.error("[checkout/complete] page error:", e);
    message =
      e instanceof Error
        ? e.message
        : "Something went wrong confirming your payment. Contact us on WhatsApp with your receipt.";
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <CheckoutCompleteClient success={success} message={message} orderId={orderId} />
    </div>
  );
}
