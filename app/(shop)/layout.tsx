import { ShopCartProvider } from "@/components/shop/cart-provider";
import { ShopCatalogNavProvider } from "@/components/shop/shop-catalog-nav-context";
import { SiteShell } from "@/components/site-shell";
import { ShopClosed } from "@/components/shop/shop-closed";
import { countCustomerProcessingOrders } from "@/lib/order-active";
import { runOrderMaintenance } from "@/lib/order-maintenance";
import { listCustomerOrders } from "@/lib/order-store";
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

  const activeOrderCount = customer
    ? countCustomerProcessingOrders(await listCustomerOrders(customer.id))
    : 0;

  return (
    <ShopCartProvider>
      <ShopCatalogNavProvider>
        <SiteShell customer={customer} activeOrderCount={activeOrderCount}>
          {shopOpen ? children : <ShopClosed />}
        </SiteShell>
      </ShopCatalogNavProvider>
    </ShopCartProvider>
  );
}
