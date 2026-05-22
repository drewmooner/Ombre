import { randomUUID } from "crypto";
import type { Catalog } from "./catalog-types";
import { inferDefaultProductName } from "./catalog-product-defaults";
import { prepareDb, usesSupabase } from "./db-backend";
import {
  deleteRemovedImageUrls,
  deleteShopImageUrls,
} from "./supabase/storage";
import * as json from "./json-data";
import { slugify } from "./slug";
import { deleteProductsByCatalogId } from "./product-store";
import { getSupabaseAdmin } from "./supabase/admin";
import { catalogFromRow, catalogToRow } from "./supabase/mappers";

export type DeleteCatalogResult = {
  catalog: Catalog;
  deletedProductCount: number;
};

export async function listCatalogs(): Promise<Catalog[]> {
  if (!usesSupabase()) return json.jsonListCatalogs();
  await prepareDb();
  const { data, error } = await getSupabaseAdmin()
    .from("catalogs")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => catalogFromRow(row));
}

export async function findCatalogById(id: string): Promise<Catalog | null> {
  if (!usesSupabase()) return json.jsonFindCatalogById(id);
  await prepareDb();
  const { data, error } = await getSupabaseAdmin()
    .from("catalogs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? catalogFromRow(data) : null;
}

export async function findCatalogBySlug(slug: string): Promise<Catalog | null> {
  if (!usesSupabase()) return json.jsonFindCatalogBySlug(slug);
  await prepareDb();
  const { data, error } = await getSupabaseAdmin()
    .from("catalogs")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? catalogFromRow(data) : null;
}

export type CatalogInput = Omit<Catalog, "id" | "defaultProductName"> & {
  id?: string;
  defaultProductName?: string;
};

export async function createCatalogRecord(input: CatalogInput): Promise<Catalog> {
  const slug = input.slug || slugify(input.name);
  if (!slug) throw new Error("Could not generate a URL slug");

  const existing = await findCatalogBySlug(slug);
  if (existing) throw new Error("A catalog with this URL slug already exists");

  const catalog: Catalog = {
    ...input,
    id: input.id ?? randomUUID(),
    slug,
    defaultProductName:
      input.defaultProductName?.trim() ||
      inferDefaultProductName(input.name, slug),
  };

  if (!usesSupabase()) return json.jsonCreateCatalog(catalog);
  await prepareDb();
  const { error } = await getSupabaseAdmin()
    .from("catalogs")
    .insert(catalogToRow(catalog));
  if (error) throw new Error(error.message);
  return catalog;
}

export async function updateCatalogRecord(
  id: string,
  input: CatalogInput,
): Promise<Catalog> {
  const current = await findCatalogById(id);
  if (!current) throw new Error("Catalog not found");

  const slug = input.slug || slugify(input.name);
  const conflict = await findCatalogBySlug(slug);
  if (conflict && conflict.id !== id) {
    throw new Error("Another catalog already uses this URL slug");
  }

  const updated: Catalog = {
    ...input,
    id,
    slug,
    defaultProductName:
      input.defaultProductName?.trim() ||
      current.defaultProductName ||
      inferDefaultProductName(input.name, slug),
  };

  await deleteRemovedImageUrls(
    current.image ? [current.image] : [],
    updated.image ? [updated.image] : [],
  );

  if (!usesSupabase()) return json.jsonUpdateCatalog(updated);
  await prepareDb();
  const { error } = await getSupabaseAdmin()
    .from("catalogs")
    .update(catalogToRow(updated))
    .eq("id", id);
  if (error) throw new Error(error.message);
  return updated;
}

export async function deleteCatalogRecord(id: string): Promise<DeleteCatalogResult> {
  const catalog = await findCatalogById(id);
  if (!catalog) throw new Error("Catalog not found");

  const deletedProductCount = await deleteProductsByCatalogId(id);

  await deleteShopImageUrls(catalog.image ? [catalog.image] : []);

  if (!usesSupabase()) {
    const removed = await json.jsonDeleteCatalog(id);
    return { catalog: removed, deletedProductCount };
  }

  await prepareDb();
  const { error } = await getSupabaseAdmin().from("catalogs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { catalog, deletedProductCount };
}
