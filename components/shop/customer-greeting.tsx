import { firstNameFromEmail } from "@/lib/shop/display-name";
import type { ShopCustomer } from "@/lib/shop-types";

type CustomerGreetingProps = {
  customer: ShopCustomer;
};

export function CustomerGreeting({ customer }: CustomerGreetingProps) {
  const firstName = firstNameFromEmail(customer.email);

  return (
    <div
      className="site-customer-greeting mx-auto w-full max-w-7xl px-4 sm:px-6"
      aria-label={`Signed in as ${customer.email}`}
    >
      <h1 className="site-customer-greeting-text font-display">
        <span className="site-customer-greeting-hi">Hi,</span>{" "}
        <span className="site-customer-greeting-name">{firstName}</span>
      </h1>
    </div>
  );
}
