import { randomUUID } from "crypto";
import type { Product } from "./product-types";
import { prepareDb, usesSupabase } from "./db-backend";
import {
  deleteRemovedImageUrls,
  deleteShopImageUrls,
} from "./supabase/storage";
import * as json from "./json-data";
import { slugify } from "./slug";
import { getSupabaseAdmin } from "./supabase/admin";
import { productFromRow, productToRow } from "./supabase/mappers";

export async function listProducts(): Promise<Product[]> {
  if (!usesSupabase()) return json.jsonListProducts();
  await prepareDb();
  const { data, error } = await getSupabaseAdmin().from("products").select("*");
  if (error) throw new Error(error.message);
  const products = (data ?? []).map((row) => productFromRow(row));
  return products.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function listProductsByCatalogId(
  catalogId: string,
): Promise<Product[]> {
  if (!usesSupabase()) return json.jsonListProductsByCatalogId(catalogId);
  await prepareDb();
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select("*")
    .eq("catalog_id", catalogId)
    .order("featured", { ascending: false })
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => productFromRow(row));
}

export async function listProductsByCatalogPage(
  catalogId: string,
  offset: number,
  limit: number,
): Promise<{ products: Product[]; total: number }> {
  const safeOffset = Math.max(0, Math.floor(offset));
  const safeLimit = Math.min(48, Math.max(1, Math.floor(limit)));

  if (!usesSupabase()) {
    return json.jsonListProductsByCatalogPage(catalogId, safeOffset, safeLimit);
  }

  await prepareDb();
  const supabase = getSupabaseAdmin();

  const { count, error: countErr } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("catalog_id", catalogId);
  if (countErr) throw new Error(countErr.message);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("catalog_id", catalogId)
    .order("featured", { ascending: false })
    .order("name")
    .range(safeOffset, safeOffset + safeLimit - 1);
  if (error) throw new Error(error.message);

  return {
    products: (data ?? []).map((row) => productFromRow(row)),
    total: count ?? 0,
  };
}

export async function countProductsByCatalogId(catalogId: string): Promise<number> {
  if (!usesSupabase()) return json.jsonCountProductsByCatalogId(catalogId);
  await prepareDb();
  const { count, error } = await getSupabaseAdmin()
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("catalog_id", catalogId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function findProductBySlug(slug: string): Promise<Product | null> {
  if (!usesSupabase()) return json.jsonFindProductBySlug(slug);
  await prepareDb();
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? productFromRow(data) : null;
}

export async function findProductById(id: string): Promise<Product | null> {
  if (!usesSupabase()) return json.jsonFindProductById(id);
  await prepareDb();
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? productFromRow(data) : null;
}

export type ProductInput = Omit<Product, "id"> & { id?: string };

export async function createProductRecord(
  input: ProductInput,
): Promise<Product> {
  const slug = input.slug || slugify(input.name);
  const existing = await findProductBySlug(slug);
  if (existing) throw new Error("A product with this URL slug already exists");

  const product: Product = {
    ...input,
    id: input.id ?? randomUUID(),
    slug,
  };

  if (!usesSupabase()) return json.jsonCreateProduct(product);
  await prepareDb();
  const { error } = await getSupabaseAdmin()
    .from("products")
    .insert(productToRow(product));
  if (error) throw new Error(error.message);
  return product;
}

export async function updateProductRecord(
  id: string,
  input: ProductInput,
): Promise<Product> {
  const current = await findProductById(id);
  if (!current) throw new Error("Product not found");

  const slug = input.slug || slugify(input.name);
  const conflict = await findProductBySlug(slug);
  if (conflict && conflict.id !== id) {
    throw new Error("Another product already uses this URL slug");
  }

  const updated: Product = { ...input, id, slug };
  if (!usesSupabase()) return json.jsonUpdateProduct(updated);
  await prepareDb();
  const { error } = await getSupabaseAdmin()
    .from("products")
    .update(productToRow(updated))
    .eq("id", id);
  if (error) throw new Error(error.message);
  return updated;
}

/** Deletes every product in a catalog (storage images + rows). */
export async function deleteProductsByCatalogId(
  catalogId: string,
): Promise<number> {
  const products = await listProductsByCatalogId(catalogId);
  for (const product of products) {
    await deleteProductRecord(product.id);
  }
  return products.length;
}

export async function deleteProductRecord(id: string): Promise<Product> {
  const product = await findProductById(id);
  if (!product) throw new Error("Product not found");

  await deleteShopImageUrls(product.images);

  if (!usesSupabase()) return json.jsonDeleteProduct(id);
  await prepareDb();
  const { error } = await getSupabaseAdmin().from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return product;
}

export async function toggleProductStockRecord(id: string): Promise<Product> {
  const product = await findProductById(id);
  if (!product) throw new Error("Product not found");

  product.pieces = product.pieces > 0 ? 0 : 1;
  product.inStock = product.pieces > 0;

  if (!usesSupabase()) return json.jsonUpdateProductStock(product);
  await prepareDb();
  const { error } = await getSupabaseAdmin()
    .from("products")
    .update({ pieces: product.pieces, in_stock: product.inStock })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return product;
}

export async function deductProductPieces(
  productId: string,
  quantity: number,
): Promise<Product> {
  if (usesSupabase()) {
    await prepareDb();
    const { atomicDeductProductPieces } = await import(
      "@/lib/supabase/atomic-stock"
    );
    return atomicDeductProductPieces(productId, quantity);
  }

  const product = await findProductById(productId);
  if (!product) throw new Error("Product not found");

  const qty = Math.max(0, Math.round(quantity));
  if (qty > product.pieces) {
    throw new Error(
      product.pieces === 0
        ? `${product.name} is out of stock`
        : `Only ${product.pieces} left for ${product.name}`,
    );
  }

  product.pieces -= qty;
  product.inStock = product.pieces > 0;
  return json.jsonUpdateProductStock(product);
}

export async function restoreProductPieces(
  productId: string,
  quantity: number,
): Promise<Product> {
  if (usesSupabase()) {
    await prepareDb();
    const { atomicRestoreProductPieces } = await import(
      "@/lib/supabase/atomic-stock"
    );
    return atomicRestoreProductPieces(productId, quantity);
  }

  const product = await findProductById(productId);
  if (!product) throw new Error("Product not found");

  const qty = Math.max(0, Math.round(quantity));
  product.pieces += qty;
  product.inStock = product.pieces > 0;
  return json.jsonUpdateProductStock(product);
}
