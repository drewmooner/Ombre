import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { runOrderMaintenance } from "@/lib/order-maintenance";
import {
  isCheckoutReady,
  isCheckoutSimulateEnabled,
} from "@/lib/checkout/checkout-mode";
import { getShopCustomer } from "@/lib/shop-auth";
import { getShopSettings } from "@/lib/shop-settings";

type CheckoutPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function CheckoutPage(_props: CheckoutPageProps) {
  await runOrderMaintenance();

  const customer = await getShopCustomer();
  if (!customer) {
    redirect("/login?next=/checkout");
  }

  const settings = await getShopSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-10">
      <Link
        href="/cart"
        className="link-accent mb-8 inline-block text-sm text-[var(--muted)]"
      >
        ← Back to bag
      </Link>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-medium sm:text-4xl">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Signed in as {customer.email}
        </p>
      </header>
      <CheckoutForm
        accountEmail={customer.email}
        paymentTimeoutMinutes={settings.paymentTimeoutMinutes}
        checkoutReady={isCheckoutReady()}
        simulateCheckout={isCheckoutSimulateEnabled()}
      />
    </div>
  );
}
