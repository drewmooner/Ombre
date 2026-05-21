import type { Product } from "./product-types";

/**
 * Customer-facing product title. Auto-generated names like "Handkerchief 2pcs 2"
 * (paired with slug handkerchief-2pcs-2) show as "Handkerchief 2pcs".
 * URLs still use the unique slug.
 */
export function getProductDisplayName(
  product: Pick<Product, "name" | "slug">,
): string {
  const name = product.name.trim();
  if (!name) return product.slug;

  const slugSuffix = product.slug.match(/-(\d+)$/);
  if (slugSuffix) {
    const suffix = ` ${slugSuffix[1]}`;
    if (name.endsWith(suffix)) {
      const base = name.slice(0, -suffix.length).trim();
      if (base) return base;
    }
  }

  return name;
}
