import { ShopCartProvider } from "@/components/shop/cart-provider";
import { SiteShell } from "@/components/site-shell";
import { ShopClosed } from "@/components/shop/shop-closed";
import { countActiveOrders } from "@/lib/order-active";
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
    ? countActiveOrders(await listCustomerOrders(customer.id))
    : 0;

  return (
    <ShopCartProvider>
      <SiteShell
        customer={customer}
        shopOpen={shopOpen}
        activeOrderCount={activeOrderCount}
      >
        {shopOpen ? children : <ShopClosed />}
      </SiteShell>
    </ShopCartProvider>
  );
}
