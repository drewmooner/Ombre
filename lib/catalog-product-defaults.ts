import type { Catalog } from "./catalog-types";
import { slugify } from "./slug";

/** Known defaults by catalog slug (used when defaultProductName is not stored). */
const BY_CATALOG_SLUG: Record<string, string> = {
  handkerchiefs: "Handkerchief 2pcs",
};

export function inferDefaultProductName(
  catalogName: string,
  catalogSlug: string,
): string {
  return BY_CATALOG_SLUG[catalogSlug] ?? catalogName;
}

/** Next free suffix: handkerchief-2pcs-1, handkerchief-2pcs-2, … */
function nextProductNumber(
  baseSlug: string,
  existingSlugs: string[],
): number {
  const taken = new Set(existingSlugs.map((s) => s.toLowerCase()));
  let n = 1;
  while (taken.has(`${baseSlug}-${n}`) || (n === 1 && taken.has(baseSlug))) {
    n += 1;
  }
  return n;
}

export function getDefaultProductFields(
  catalog: Catalog,
  existingSlugs: string[] = [],
): {
  name: string;
  slug: string;
} {
  const baseName =
    catalog.defaultProductName?.trim() ||
    inferDefaultProductName(catalog.name, catalog.slug);
  const baseSlug = slugify(baseName);
  const taken = new Set(existingSlugs.map((s) => s.toLowerCase()));
  let slug = baseSlug;
  if (taken.has(baseSlug)) {
    const n = nextProductNumber(baseSlug, existingSlugs);
    slug = `${baseSlug}-${n}`;
  }

  return { name: baseName, slug };
}
