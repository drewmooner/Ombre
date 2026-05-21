import { ShopHome } from "@/components/shop-home";
import { getCatalogsWithProducts } from "@/lib/catalogs.server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalogs = await getCatalogsWithProducts();

  return (
    <main>
      <ShopHome catalogs={catalogs} />
    </main>
  );
}
