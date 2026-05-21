import { ShopCartProvider } from "@/components/shop/cart-provider";
import { SiteShell } from "@/components/site-shell";
import { ShopClosed } from "@/components/shop/shop-closed";
import { runOrderMaintenance } from "@/lib/order-maintenance";
import { getShopCustomer } from "@/lib/shop-auth";
import { isShopOpen } from "@/lib/shop-settings";
import { prepareDb } from "@/lib/db-backend";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await prepareDb();
  await runOrderMaintenance();

  const [customer, shopOpen] = await Promise.all([
    getShopCustomer(),
    isShopOpen(),
  ]);

  return (
    <ShopCartProvider>
      <SiteShell customer={customer} shopOpen={shopOpen}>
        {shopOpen ? children : <ShopClosed />}
      </SiteShell>
    </ShopCartProvider>
  );
}
