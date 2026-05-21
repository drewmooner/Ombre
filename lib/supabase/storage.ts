import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { getSupabaseAdmin } from "./admin";
import { isSupabaseConfigured, getSupabaseUrl } from "./config";
import { usesSupabase } from "@/lib/db-backend";
import { prepareDb } from "@/lib/db-backend";

/** Public bucket for catalog covers and product photos. */
export const PRODUCT_IMAGES_BUCKET = "product-images";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function bucketExistsMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("already exists") || lower.includes("duplicate");
}

/** Create the public product-images bucket (no-op if it already exists). */
export async function ensureProductImagesBucket(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.createBucket(PRODUCT_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_BYTES,
    allowedMimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ],
  });

  if (error && !bucketExistsMessage(error.message)) {
    throw new Error(`Could not create storage bucket: ${error.message}`);
  }
}

export function isSupabaseStorageUrl(url: string): boolean {
  const base = getSupabaseUrl();
  if (!base) return false;
  try {
    const parsed = new URL(url, base);
    const expected = new URL(base);
    return (
      parsed.hostname === expected.hostname &&
      parsed.pathname.includes(
        `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`,
      )
    );
  } catch {
    return false;
  }
}

/** Object path inside `product-images` from a public storage URL. */
export function storageObjectPathFromUrl(url: string): string | null {
  if (!isSupabaseStorageUrl(url)) return null;
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

function localUploadFilePath(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null;
  const name = path.basename(url);
  if (!name || name.includes("..")) return null;
  return path.join(process.cwd(), "public", "uploads", name);
}

async function deleteLocalUpload(url: string): Promise<void> {
  const filePath = localUploadFilePath(url);
  if (!filePath) return;
  await unlink(filePath).catch(() => undefined);
}

async function uploadToLocalDisk(
  file: File,
): Promise<{ url?: string; error?: string }> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.name) || ".jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, safeName), buffer);

  return { url: `/uploads/${safeName}` };
}

async function uploadToSupabaseStorage(
  file: File,
): Promise<{ url?: string; error?: string }> {
  await ensureProductImagesBucket();

  const ext = path.extname(file.name) || ".jpg";
  const objectPath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(objectPath, buffer, {
      contentType: file.type || "image/jpeg",
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(objectPath);

  return { url: data.publicUrl };
}

export async function uploadShopImage(
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image must be under 5MB" };
  }

  if (usesSupabase()) {
    return uploadToSupabaseStorage(file);
  }
  return uploadToLocalDisk(file);
}

/** Delete stored files for URLs we manage (Supabase Storage + local /uploads). */
export async function deleteShopImageUrls(urls: string[]): Promise<void> {
  const unique = [...new Set(urls.filter(Boolean))];
  if (unique.length === 0) return;

  const storagePaths: string[] = [];
  for (const url of unique) {
    const objectPath = storageObjectPathFromUrl(url);
    if (objectPath) storagePaths.push(objectPath);
    else await deleteLocalUpload(url);
  }

  if (!isSupabaseConfigured() || storagePaths.length === 0) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove(storagePaths);

  if (error) {
    console.warn("[storage] Could not delete images:", error.message);
  }
}

/** Remove files that were dropped from a product/catalog after an edit. */
export async function deleteRemovedImageUrls(
  previous: string[],
  next: string[],
): Promise<void> {
  const nextSet = new Set(next);
  const removed = previous.filter((url) => url && !nextSet.has(url));
  await deleteShopImageUrls(removed);
}
