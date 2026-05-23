import { ShopHome } from "@/components/shop-home";
import { CustomerGreeting } from "@/components/shop/customer-greeting";
import { getCatalogsWithProducts } from "@/lib/catalogs.server";
import { getShopCustomer } from "@/lib/shop-auth";
import { isShopOpen } from "@/lib/shop-settings";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { q } = await searchParams;
  const searchQuery = typeof q === "string" ? q.trim() : "";

  const [catalogSections, customer, shopOpen] = await Promise.all([
    getCatalogsWithProducts(),
    getShopCustomer(),
    isShopOpen(),
  ]);

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
          catalogSections={catalogSections}
          searchQuery={searchQuery}
          compactTop={showGreeting}
        />
      </div>
    </main>
  );
}
