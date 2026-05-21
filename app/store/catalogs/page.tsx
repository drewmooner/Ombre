import Link from "next/link";
import { CatalogGrid } from "@/components/store/catalog-grid";
import { requireStore } from "@/lib/store-auth";
import { getCatalogs } from "@/lib/catalogs.server";
import { countProductsByCatalogId } from "@/lib/product-store";
import { MorphButton } from "@/components/morph-button";

export default async function StoreCatalogsPage() {
  await requireStore();
  const catalogs = await getCatalogs();
  const withCounts = await Promise.all(
    catalogs.map(async (catalog) => ({
      ...catalog,
      productCount: await countProductsByCatalogId(catalog.id),
    })),
  );

  return (
    <article className="store-page">
      <header className="store-page-header">
        <div>
          <p className="store-eyebrow">Store dashboard</p>
          <h1 className="store-title">Catalogs</h1>
          <p className="store-lead">
            Tap a catalog to manage its products. Your shop homepage updates automatically.
          </p>
        </div>
        <MorphButton href="/store/catalogs/new" variant="primary" className="w-full sm:w-auto">
          New catalog
        </MorphButton>
      </header>

      {withCounts.length === 0 ? (
        <section className="store-card store-empty">
          <p className="font-display text-xl font-medium">No catalogs yet</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create a catalog with a name, cover image, and default price.
          </p>
          <MorphButton href="/store/catalogs/new" variant="primary" className="mt-6">
            Create first catalog
          </MorphButton>
        </section>
      ) : (
        <CatalogGrid catalogs={withCounts} />
      )}

      <p className="store-footer-link">
        <Link href="/" className="link-accent">View live shop →</Link>
      </p>
    </article>
  );
}
