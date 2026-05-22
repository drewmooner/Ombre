import { ShopHome } from "@/components/shop-home";
import { CustomerGreeting } from "@/components/shop/customer-greeting";
import { getCatalogsWithProducts } from "@/lib/catalogs.server";
import { getShopCustomer } from "@/lib/shop-auth";
import { isShopOpen } from "@/lib/shop-settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [catalogs, customer, shopOpen] = await Promise.all([
    getCatalogsWithProducts(),
    getShopCustomer(),
    isShopOpen(),
  ]);

  return (
    <main>
      {shopOpen && customer ? (
        <section className="site-customer-greeting-band" aria-label="Welcome">
          <CustomerGreeting customer={customer} />
        </section>
      ) : null}
      <ShopHome catalogs={catalogs} />
    </main>
  );
}
