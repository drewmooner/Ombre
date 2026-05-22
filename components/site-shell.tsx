import { Footer } from "./footer";
import { Header } from "./header";
import { WhatsAppButton } from "./whatsapp-button";
import type { ShopCustomer } from "@/lib/shop-types";

type SiteShellProps = {
  children: React.ReactNode;
  customer?: ShopCustomer | null;
  activeOrderCount?: number;
};

export function SiteShell({
  children,
  customer = null,
  activeOrderCount = 0,
}: SiteShellProps) {
  return (
    <div className="page-ambient flex min-h-full flex-col">
      <Header customer={customer} activeOrderCount={activeOrderCount} />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
