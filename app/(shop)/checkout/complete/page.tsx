import Link from "next/link";
import { CheckoutCompleteClient } from "@/components/shop/checkout-complete-client";
import { fulfillOrderPayment } from "@/lib/checkout/fulfill-payment";
import { sendPaymentReceiptIfNeeded } from "@/lib/email/order-emails";
import { runOrderMaintenance } from "@/lib/order-maintenance";

type CompletePageProps = {
  searchParams: Promise<{ reference?: string }>;
};

export default async function CheckoutCompletePage({
  searchParams,
}: CompletePageProps) {
  const { reference } = await searchParams;

  if (!reference?.trim()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-[var(--muted)]">Missing payment reference.</p>
        <Link href="/cart" className="link-accent mt-4 inline-block text-sm">
          Back to bag
        </Link>
      </div>
    );
  }

  const result = await fulfillOrderPayment(reference.trim(), {
    revalidate: false,
  });

  await runOrderMaintenance();

  let message: string;
  if (!result.ok) {
    message = result.error;
  } else {
    const emailResult = await sendPaymentReceiptIfNeeded(result.orderId);
    if (!emailResult.ok) {
      message = `Payment confirmed, but we could not email your receipt (${emailResult.error}). Check spam or contact us on WhatsApp.`;
    } else if ("skipped" in emailResult && emailResult.skipped) {
      message =
        "Thank you — your payment is confirmed. Your receipt was already emailed.";
    } else {
      message =
        "Thank you — your payment is confirmed. We've emailed you a receipt and will prepare your order for delivery.";
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <CheckoutCompleteClient success={result.ok} message={message} />
    </div>
  );
}
