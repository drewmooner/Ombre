import type { CatalogWithCount } from "@/lib/catalog-types";

export function catalogHeaderId(catalogId: string): string {
  return `shop-catalog-${catalogId}`;
}

export function catalogsWithProducts(
  catalogs: CatalogWithCount[],
): CatalogWithCount[] {
  return catalogs.filter((c) => c.productCount > 0);
}

export function firstCatalogWithProducts(
  catalogs: CatalogWithCount[],
): CatalogWithCount | undefined {
  return catalogsWithProducts(catalogs)[0];
}
