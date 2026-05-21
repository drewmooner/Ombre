import Link from "next/link";
import { CheckoutCompleteClient } from "@/components/shop/checkout-complete-client";
import { fulfillOrderPayment } from "@/lib/checkout/fulfill-payment";
import { runOrderMaintenance } from "@/lib/order-maintenance";

type CompletePageProps = {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
};

function paymentReference(
  searchParams: { reference?: string; trxref?: string },
): string | null {
  const ref = searchParams.reference?.trim() || searchParams.trxref?.trim();
  return ref || null;
}

export default async function CheckoutCompletePage({
  searchParams,
}: CompletePageProps) {
  const params = await searchParams;
  const reference = paymentReference(params);

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

  try {
    const result = await fulfillOrderPayment(reference, {
      revalidate: false,
    });

    await runOrderMaintenance();

    success = result.ok;
    if (!result.ok) {
      message = result.error;
    } else {
      message =
        "Thank you — your payment is confirmed. We've emailed you a receipt and will prepare your order for delivery.";
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
      <CheckoutCompleteClient success={success} message={message} />
    </div>
  );
}
