import { redirect } from "next/navigation";
import { ShopLoginForm } from "@/components/shop/login-form";
import { getShopCustomer } from "@/lib/shop-auth";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const customer = await getShopCustomer();
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (customer) redirect(safeNext);

  const forCheckout =
    safeNext === "/checkout" || safeNext.startsWith("/checkout/");

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-16">
      <ShopLoginForm redirectTo={safeNext} forCheckout={forCheckout} />
    </div>
  );
}
