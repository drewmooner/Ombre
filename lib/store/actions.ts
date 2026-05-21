"use server";

import { revalidatePath } from "next/cache";
import { uploadShopImage } from "@/lib/supabase/storage";
import {
  createStoreSession,
  destroyStoreSession,
  verifyStorePassword,
} from "@/lib/store-auth";
import {
  createCatalogRecord,
  deleteCatalogRecord,
  updateCatalogRecord,
} from "@/lib/catalog-store";
import {
  countProductsByCatalogId,
  createProductRecord,
  deductProductPieces,
  deleteProductRecord,
  findProductById,
  toggleProductStockRecord,
  updateProductRecord,
} from "@/lib/product-store";
import {
  DEFAULT_PRODUCT_DESCRIPTION,
  DEFAULT_PRODUCT_DETAILS,
} from "@/lib/product-defaults";
import { findCatalogById } from "@/lib/catalog-store";
import { slugify } from "@/lib/slug";
import { setShopOpen } from "@/lib/shop-settings";
import type { FormActionState } from "@/lib/form-action-state";

export type ActionState = FormActionState;

async function requireStoreAction(): Promise<void> {
  const { isStoreAuthenticated } = await import("@/lib/store-auth");
  if (!(await isStoreAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

function revalidateShop() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/store/catalogs");
}

function actionFailure(e: unknown, fallback: string): ActionState {
  const digest =
    e && typeof e === "object" && "digest" in e
      ? String((e as { digest?: string }).digest)
      : "";
  if (digest.startsWith("NEXT_REDIRECT")) throw e;
  return { error: e instanceof Error ? e.message : fallback };
}

export async function loginStore(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (!verifyStorePassword(password)) {
    return { error: "Incorrect password" };
  }
  await createStoreSession();
  return { redirectTo: "/store/catalogs" };
}

export async function logoutStoreAction(
  _prev: ActionState = {},
): Promise<ActionState> {
  await destroyStoreSession();
  return { redirectTo: "/store/login" };
}

export async function setShopOpenAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireStoreAction();
    const open = formData.get("shopOpen") === "true";
    await setShopOpen(open);
    revalidateShop();
    return {
      success: open
        ? "Shop is live — customers can browse and buy."
        : "Shop is closed — customers see your restocking message.",
      shopOpen: open,
    };
  } catch (e) {
    return actionFailure(e, "Could not update shop status");
  }
}

export async function uploadProductImage(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  await requireStoreAction();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file selected" };
  }

  return uploadShopImage(file);
}

type CatalogFormInput = {
  name: string;
  slug: string;
  image: string;
  defaultPrice: number;
};

async function parseCatalogForm(
  formData: FormData,
): Promise<CatalogFormInput | { error: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugRaw || slugify(name);
  const image = String(formData.get("image") ?? "").trim();
  const defaultPrice = Number(formData.get("defaultPrice"));

  if (!name) return { error: "Enter a catalog name" };
  if (!slug) return { error: "Enter a URL slug" };
  if (!image) return { error: "Add a cover image" };
  if (!Number.isFinite(defaultPrice) || defaultPrice < 0) {
    return { error: "Enter a valid default price in Naira" };
  }

  return {
    name,
    slug,
    image,
    defaultPrice: Math.round(defaultPrice),
  };
}

export async function createCatalog(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStoreAction();

  const parsed = await parseCatalogForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const catalog = await createCatalogRecord(parsed);
    revalidateShop();
    return { redirectTo: `/store/catalogs/${catalog.id}` };
  } catch (e) {
    return actionFailure(e, "Could not create catalog");
  }
}

export async function updateCatalog(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStoreAction();

  const parsed = await parseCatalogForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    await updateCatalogRecord(id, parsed);
    revalidateShop();
    revalidatePath(`/store/catalogs/${id}`);
    revalidatePath("/store/catalogs");
    return { redirectTo: `/store/catalogs/${id}?updated=1` };
  } catch (e) {
    return actionFailure(e, "Could not update catalog");
  }
}

export async function deleteCatalogAction(
  id: string,
  _prev: ActionState,
): Promise<ActionState> {
  await requireStoreAction();

  const count = await countProductsByCatalogId(id);
  if (count > 0) {
    return {
      error: `Remove ${count} product${count === 1 ? "" : "s"} from this catalog first.`,
    };
  }

  try {
    const catalog = await deleteCatalogRecord(id);
    revalidateShop();
    return { success: `"${catalog.name}" removed` };
  } catch (e) {
    return actionFailure(e, "Could not delete catalog");
  }
}

type ProductFormInput = {
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  catalogId: string;
  pieces: number;
  sizes?: string[];
  inStock: boolean;
  featured: boolean;
  images: string[];
  details: string[];
  slug: string;
};

function parseProductSizes(raw: string): string[] | undefined {
  const sizes = raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sizes.length > 0 ? sizes : undefined;
}

async function parseProductForm(
  formData: FormData,
): Promise<ProductFormInput | { error: string }> {
  const catalogId = String(formData.get("catalogId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const priceRaw = Number(formData.get("price"));
  const imagesRaw = String(formData.get("images") ?? "").trim();

  if (!catalogId) return { error: "Catalog not found" };
  if (!name) return { error: "Enter a product name" };
  if (!Number.isFinite(priceRaw) || priceRaw < 0) {
    return { error: "Enter a valid price in Naira" };
  }

  const images = imagesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (images.length === 0) {
    return { error: "Add at least one product photo" };
  }

  const slug = slugRaw || slugify(name);
  if (!slug) return { error: "Could not generate a URL slug" };

  if (!(await findCatalogById(catalogId))) {
    return { error: "Catalog not found" };
  }

  const piecesRaw = Number(formData.get("pieces"));
  if (!Number.isFinite(piecesRaw) || piecesRaw < 0) {
    return { error: "Enter a valid number of pieces (0 or more)" };
  }
  const pieces = Math.round(piecesRaw);
  const sizes = parseProductSizes(String(formData.get("sizes") ?? ""));

  return {
    name,
    shortDescription: "",
    description: DEFAULT_PRODUCT_DESCRIPTION,
    price: Math.round(priceRaw),
    compareAtPrice: null,
    catalogId,
    pieces,
    sizes,
    inStock: pieces > 0,
    featured: true,
    images,
    details: DEFAULT_PRODUCT_DETAILS,
    slug,
  };
}

function toProductRecord(parsed: ProductFormInput) {
  return {
    name: parsed.name,
    shortDescription: parsed.shortDescription,
    description: parsed.description,
    price: parsed.price,
    compareAtPrice: parsed.compareAtPrice ?? undefined,
    catalogId: parsed.catalogId,
    pieces: parsed.pieces,
    sizes: parsed.sizes,
    inStock: parsed.inStock,
    featured: parsed.featured,
    images: parsed.images,
    details: parsed.details,
    slug: parsed.slug,
  };
}

export async function createProduct(
  catalogId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStoreAction();
  formData.set("catalogId", catalogId);

  const parsed = await parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    await createProductRecord(toProductRecord(parsed));
    revalidateShop();
    revalidatePath(`/store/catalogs/${catalogId}`);
    return { success: `"${parsed.name}" is live` };
  } catch (e) {
    return actionFailure(e, "Could not create product");
  }
}

export async function updateProduct(
  catalogId: string,
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStoreAction();
  formData.set("catalogId", catalogId);

  const parsed = await parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await findProductById(productId);
  const record = toProductRecord({
    ...parsed,
    description: existing?.description ?? parsed.description,
  });

  try {
    const product = await updateProductRecord(productId, record);
    revalidateShop();
    revalidatePath(`/store/catalogs/${catalogId}`);
    revalidatePath(`/product/${product.slug}`);
    revalidatePath(`/store/catalogs/${catalogId}/products/${productId}/edit`);
    return {
      success: `"${product.name}" saved`,
      redirectTo: `/store/catalogs/${catalogId}?productUpdated=1`,
    };
  } catch (e) {
    return actionFailure(e, "Could not update product");
  }
}

export async function deleteProductAction(
  catalogId: string,
  productId: string,
  _prev: ActionState,
): Promise<ActionState> {
  await requireStoreAction();

  try {
    const product = await deleteProductRecord(productId);
    revalidateShop();
    revalidatePath(`/store/catalogs/${catalogId}`);
    return { success: `"${product.name}" removed` };
  } catch (e) {
    return actionFailure(e, "Could not delete product");
  }
}

export async function toggleProductStockAction(
  catalogId: string,
  productId: string,
  _prev: ActionState,
): Promise<ActionState> {
  await requireStoreAction();

  try {
    const product = await toggleProductStockRecord(productId);
    revalidateShop();
    revalidatePath(`/store/catalogs/${catalogId}`);
    return {
      success: product.inStock
        ? `Marked in stock (${product.pieces} pcs)`
        : "Marked out of stock (0 pcs)",
    };
  } catch (e) {
    return actionFailure(e, "Could not update stock");
  }
}

export async function deductStockForOrder(
  items: { productId: string; quantity: number }[],
): Promise<{ ok: true } | { error: string }> {
  if (!items.length) return { error: "Your bag is empty" };

  try {
    for (const item of items) {
      const product = await findProductById(item.productId);
      if (!product) {
        return { error: "A product in your bag is no longer available" };
      }
      const qty = Math.max(1, Math.round(item.quantity));
      if (qty > product.pieces) {
        return {
          error:
            product.pieces === 0
              ? `${product.name} is out of stock`
              : `Only ${product.pieces} left for ${product.name}`,
        };
      }
    }

    for (const item of items) {
      await deductProductPieces(
        item.productId,
        Math.max(1, Math.round(item.quantity)),
      );
    }

    revalidateShop();
    return { ok: true };
  } catch (e) {
    const digest =
      e && typeof e === "object" && "digest" in e
        ? String((e as { digest?: string }).digest)
        : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw e;
    return {
      error: e instanceof Error ? e.message : "Could not update stock",
    };
  }
}
