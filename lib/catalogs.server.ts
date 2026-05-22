import {
  findCatalogById,
  findCatalogBySlug,
  listCatalogs,
} from "./catalog-store";
import {
  countProductsByCatalogId,
  listProducts,
  listProductsByCatalogPage,
} from "./product-store";
import type { CatalogWithCount, CatalogWithProducts } from "./catalog-types";
import {
  catalogProductsPageMeta,
  SHOP_PRODUCTS_PAGE_SIZE,
  type CatalogProductsPage,
} from "./shop/pagination";

export async function getCatalogs() {
  return listCatalogs();
}

export async function getCatalogById(id: string) {
  return findCatalogById(id);
}

export async function getCatalogBySlug(slug: string) {
  return findCatalogBySlug(slug);
}

export async function getCatalogsWithProducts(): Promise<CatalogWithProducts[]> {
  const [catalogs, products] = await Promise.all([
    listCatalogs(),
    listProducts(),
  ]);

  return catalogs
    .map((catalog) => ({
      ...catalog,
      products: products.filter((p) => p.catalogId === catalog.id),
    }))
}

export async function getCatalogWithProducts(
  catalogId: string,
): Promise<CatalogWithProducts | null> {
  const catalog = await findCatalogById(catalogId);
  if (!catalog) return null;

  const products = await listProducts();
  return {
    ...catalog,
    products: products.filter((p) => p.catalogId === catalog.id),
  };
}

export async function getCatalogsWithProductCounts(): Promise<CatalogWithCount[]> {
  const catalogs = await listCatalogs();
  const counts = await Promise.all(
    catalogs.map((c) => countProductsByCatalogId(c.id)),
  );
  return catalogs.map((catalog, i) => ({
    ...catalog,
    productCount: counts[i] ?? 0,
  }));
}

export async function getCatalogProductsPage(
  catalogId: string,
  offset = 0,
): Promise<CatalogProductsPage | null> {
  const catalog = await findCatalogById(catalogId);
  if (!catalog) return null;

  const limit = SHOP_PRODUCTS_PAGE_SIZE;
  const { products, total } = await listProductsByCatalogPage(
    catalogId,
    offset,
    limit,
  );

  return {
    products,
    ...catalogProductsPageMeta(total, offset, limit, products.length),
  };
}
