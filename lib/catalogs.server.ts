import {
  findCatalogById,
  findCatalogBySlug,
  listCatalogs,
} from "./catalog-store";
import { listProducts } from "./product-store";
import type { CatalogWithProducts } from "./catalog-types";

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
