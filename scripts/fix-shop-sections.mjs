import { writeFileSync } from "fs";

const d = "d" + "iv";

writeFileSync(
  "components/shop-catalog-sections.tsx",
  `import type { CatalogWithProducts } from "@/lib/catalog-types";
import { ProductCard } from "./product-card";

type ShopCatalogSectionsProps = {
  catalogs: CatalogWithProducts[];
};

export function ShopCatalogSections({ catalogs }: ShopCatalogSectionsProps) {
  const visible = catalogs.filter((c) => c.products.length > 0);

  if (visible.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-10">
        <p className="text-[var(--muted)]">No listings yet.</p>
      </section>
    );
  }

  return (
    <${d} className="space-y-12 pb-12 sm:space-y-14 sm:pb-14">
      {visible.map((catalog) => (
        <section
          key={catalog.id}
          id={catalog.slug}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10"
        >
          {visible.length > 1 ? (
            <h2 className="mb-6 font-display text-xl font-medium text-[var(--foreground)] sm:mb-8 sm:text-2xl">
              {catalog.name}
            </h2>
          ) : null}

          <${d} className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
            {catalog.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </${d}>
        </section>
      ))}
    </${d}>
  );
}
`,
);
