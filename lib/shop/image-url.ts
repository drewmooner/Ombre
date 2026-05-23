import { getSupabaseUrl } from "@/lib/supabase/config";

/** Safe fallback when a product/catalog image is missing or fails to load. */
export const SHOP_IMAGE_PLACEHOLDER = "/logo.png";

export function normalizeShopImageUrl(
  url: string | undefined | null,
): string {
  if (typeof url !== "string") return SHOP_IMAGE_PLACEHOLDER;
  const trimmed = url.trim();
  if (!trimmed) return SHOP_IMAGE_PLACEHOLDER;
  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return trimmed;
      }
    } catch {
      return SHOP_IMAGE_PLACEHOLDER;
    }
  }
  return SHOP_IMAGE_PLACEHOLDER;
}

/** Bypass Next image optimizer for same-origin paths (avoids 500s on missing /uploads). */
/** Serve local uploads via API so missing files return a placeholder, not 500. */
export function resolveShopImageSrc(url: string | undefined | null): string {
  const normalized = normalizeShopImageUrl(url);
  if (normalized.startsWith("/uploads/")) {
    return `/api/shop/image?path=${encodeURIComponent(normalized)}`;
  }
  return normalized;
}

export function shouldUnoptimizeShopImage(url: string): boolean {
  return url.startsWith("/");
}

export function isAllowedDownloadImageHost(hostname: string): boolean {
  if (hostname === "images.unsplash.com") return true;
  const base = getSupabaseUrl();
  if (!base) return false;
  try {
    return new URL(base).hostname === hostname;
  } catch {
    return false;
  }
}
