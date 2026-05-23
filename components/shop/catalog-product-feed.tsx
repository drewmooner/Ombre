import { Fragment } from "react";
import type { CatalogWithProducts } from "@/lib/catalog-types";
import { compareCatalogs } from "@/lib/catalog-order";
import { catalogHeaderId } from "@/lib/shop/catalog-nav";
import { ProductCard } from "@/components/product-card";

type CatalogProductFeedProps = {
  catalogs: CatalogWithProducts[];
};

export function CatalogProductFeed({ catalogs }: CatalogProductFeedProps) {
  const sections = [...catalogs]
    .filter((c) => c.products.length > 0)
    .sort(compareCatalogs);

  if (sections.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[var(--muted)]">
        No products yet.
      </p>
    );
  }

  return (
    <div className="shop-catalog-feed">
      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
        {sections.map((catalog) => (
          <Fragment key={catalog.id}>
            <li
              id={catalogHeaderId(catalog.id)}
              className="shop-catalog-divider"
            >
              <h2 className="shop-catalog-divider__title">{catalog.name}</h2>
            </li>
            {catalog.products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </Fragment>
        ))}
      </ul>
    </div>
  );
}
