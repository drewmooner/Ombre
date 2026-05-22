import { ShopHome } from "@/components/shop-home";
import { CustomerGreeting } from "@/components/shop/customer-greeting";
import {
  getCatalogProductsPage,
  getCatalogsWithProductCounts,
} from "@/lib/catalogs.server";
import { getShopCustomer } from "@/lib/shop-auth";
import { isShopOpen } from "@/lib/shop-settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [catalogs, customer, shopOpen] = await Promise.all([
    getCatalogsWithProductCounts(),
    getShopCustomer(),
    isShopOpen(),
  ]);

  const sorted = [...catalogs].sort((a, b) => a.name.localeCompare(b.name));
  const firstCatalog = sorted[0];
  const firstPage = firstCatalog
    ? await getCatalogProductsPage(firstCatalog.id, 0)
    : null;

  const showGreeting = shopOpen && Boolean(customer);

  return (
    <main>
      <div
        className={
          showGreeting ? "shop-page-shell shop-page-shell--greeted" : "shop-page-shell"
        }
      >
        {showGreeting && customer ? (
          <section
            className="site-customer-greeting-band"
            aria-label="Welcome"
          >
            <CustomerGreeting customer={customer} />
          </section>
        ) : null}
        <ShopHome
          catalogs={catalogs}
          initialCatalogId={firstCatalog?.id ?? ""}
          initialProducts={firstPage?.products ?? []}
          initialTotal={firstPage?.total ?? 0}
          compactTop={showGreeting}
        />
      </div>
    </main>
  );
}
