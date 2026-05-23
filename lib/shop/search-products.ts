import { getProductDisplayName } from "@/lib/product-display-name";
import type { CatalogWithProducts } from "@/lib/catalog-types";
import type { Product } from "@/lib/product-types";

export function flattenCatalogProducts(
  catalogs: CatalogWithProducts[],
): Product[] {
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const catalog of catalogs) {
    for (const product of catalog.products) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      out.push(product);
    }
  }
  return out;
}

/** Match product name, display name, slug, or description (case-insensitive). */
export function filterProductsByQuery(
  products: Product[],
  query: string,
): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;

  return products.filter((product) => {
    const haystack = [
      getProductDisplayName(product),
      product.name,
      product.slug,
      product.description ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
