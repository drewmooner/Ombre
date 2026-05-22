import { BrandLogo } from "@/components/brand-logo";

export default function CheckoutCompleteLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="morph-surface mx-auto max-w-lg rounded-2xl px-6 py-12 text-center">
        <BrandLogo size="checkout" className="mx-auto mb-6" />
        <h1 className="font-display text-2xl font-medium">Confirming payment</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Please wait — we&apos;re verifying your payment with Paystack.
        </p>
      </div>
    </div>
  );
}
