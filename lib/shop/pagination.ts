/** Products loaded per shop grid page (home + API). */
export const SHOP_PRODUCTS_PAGE_SIZE = 12;

export type CatalogProductsPage = {
  products: import("@/lib/product-types").Product[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};

export function catalogProductsPageMeta(
  total: number,
  offset: number,
  limit: number,
  loaded: number,
): Pick<CatalogProductsPage, "total" | "offset" | "limit" | "hasMore"> {
  return {
    total,
    offset,
    limit,
    hasMore: offset + loaded < total,
  };
}
