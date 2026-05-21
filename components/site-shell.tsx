import { Footer } from "./footer";
import { Header } from "./header";
import { CustomerGreeting } from "./shop/customer-greeting";
import { WhatsAppButton } from "./whatsapp-button";
import type { ShopCustomer } from "@/lib/shop-types";

type SiteShellProps = {
  children: React.ReactNode;
  customer?: ShopCustomer | null;
  shopOpen?: boolean;
};

export function SiteShell({
  children,
  customer = null,
  shopOpen = true,
}: SiteShellProps) {
  return (
    <div className="page-ambient flex min-h-full flex-col">
      <Header customer={customer} />
      {shopOpen && customer ? (
        <section className="site-customer-greeting-band" aria-label="Welcome">
          <CustomerGreeting customer={customer} />
        </section>
      ) : null}
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
