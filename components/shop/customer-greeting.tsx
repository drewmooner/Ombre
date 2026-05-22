import { firstNameFromEmail } from "@/lib/shop/display-name";
import type { ShopCustomer } from "@/lib/shop-types";

type CustomerGreetingProps = {
  customer: ShopCustomer;
};

export function CustomerGreeting({ customer }: CustomerGreetingProps) {
  const firstName = firstNameFromEmail(customer.email);

  return (
    <div
      className="site-customer-greeting font-display"
      aria-label={`Signed in as ${customer.email}`}
    >
      <h1 className="site-customer-greeting-text">
        <span className="site-customer-greeting-hi">Hi,</span>
        <span className="site-customer-greeting-name">{firstName}</span>
      </h1>
    </div>
  );
}
