import { writeFileSync, mkdirSync } from "fs";

mkdirSync("app/store/catalogs", { recursive: true });
mkdirSync("app/store/catalogs/new", { recursive: true });
mkdirSync("app/store/catalogs/[id]", { recursive: true });
mkdirSync("app/store/catalogs/[id]/products/[productId]/edit", { recursive: true });

writeFileSync(
  "app/store/catalogs/page.tsx",
  `import Link from "next/link";
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
        <MorphButton href="/store/catalogs/new" variant="primary">
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
`,
);

writeFileSync(
  "app/store/catalogs/new/page.tsx",
  `import Link from "next/link";
import { CatalogForm } from "@/components/store/catalog-form";
import { requireStore } from "@/lib/store-auth";

export default async function NewCatalogPage() {
  await requireStore();

  return (
    <article className="store-page store-page-narrow">
      <Link href="/store/catalogs" className="store-back">← Catalogs</Link>
      <header className="mb-8">
        <p className="store-eyebrow">New</p>
        <h1 className="store-title">Create catalog</h1>
        <p className="store-lead">Name, cover image, and default price for new products.</p>
      </header>
      <CatalogForm />
    </article>
  );
}
`,
);

writeFileSync(
  "app/store/catalogs/[id]/page.tsx",
  `import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogProducts } from "@/components/store/catalog-products";
import { requireStore } from "@/lib/store-auth";
import { getCatalogWithProducts } from "@/lib/catalogs.server";
import { formatNaira } from "@/lib/format-price";

type CatalogPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CatalogDetailPage({ params }: CatalogPageProps) {
  await requireStore();
  const { id } = await params;
  const data = await getCatalogWithProducts(id);
  if (!data) notFound();

  const { products, ...catalog } = data;

  return (
    <article className="store-page">
      <Link href="/store/catalogs" className="store-back">← Catalogs</Link>

      <header className="store-catalog-hero">
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl sm:aspect-[3/1]">
          <Image
            src={catalog.image}
            alt={catalog.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 960px"
            priority
          />
        </div>
        <div>
          <h1 className="store-title mt-6">{catalog.name}</h1>
          <p className="store-lead mt-2">
            Default price {formatNaira(catalog.defaultPrice)} · /{catalog.slug}
          </p>
        </div>
      </header>

      <CatalogProducts catalog={catalog} products={products} />
    </article>
  );
}
`,
);

writeFileSync(
  "app/store/catalogs/[id]/products/[productId]/edit/page.tsx",
  `import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/store/product-form";
import { requireStore } from "@/lib/store-auth";
import { getCatalogById } from "@/lib/catalogs.server";
import { getProductById } from "@/lib/products.server";

type EditProductPageProps = {
  params: Promise<{ id: string; productId: string }>;
};

export default async function EditCatalogProductPage({ params }: EditProductPageProps) {
  await requireStore();
  const { id, productId } = await params;
  const [catalog, product] = await Promise.all([
    getCatalogById(id),
    getProductById(productId),
  ]);
  if (!catalog || !product || product.catalogId !== catalog.id) notFound();

  return (
    <article className="store-page store-page-narrow">
      <Link href={\`/store/catalogs/\${id}\`} className="store-back">← {catalog.name}</Link>
      <header className="mb-8">
        <p className="store-eyebrow">Edit product</p>
        <h1 className="store-title">{product.name}</h1>
      </header>
      <ProductForm catalog={catalog} product={product} />
    </article>
  );
}
`,
);
