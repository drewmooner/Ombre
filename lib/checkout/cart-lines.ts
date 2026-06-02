import type { OrderLineItem } from "@/lib/order-types";
import { getProductDisplayName } from "@/lib/product-display-name";
import { findProductById } from "@/lib/product-store";

/** Only product id + quantity come from the browser — never price. */
export type CartLineInput = {
  productId: string;
  quantity: number;
};

export type CartLineAdjustment = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  removed: boolean;
  requestedQuantity: number;
  availableQuantity: number;
};

const MAX_LINE_QTY = 99;

export function parseCartLinesForCheckout(raw: string): CartLineInput[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    const lines: CartLineInput[] = [];
    const seen = new Set<string>();

    for (const row of parsed) {
      if (!row || typeof row !== "object") return null;
      const item = row as { productId?: unknown; quantity?: unknown };
      if (typeof item.productId !== "string" || !item.productId.trim()) {
        return null;
      }
      if (typeof item.quantity !== "number" || !Number.isFinite(item.quantity)) {
        return null;
      }

      const productId = item.productId.trim();
      const quantity = Math.min(MAX_LINE_QTY, Math.max(1, Math.round(item.quantity)));

      if (seen.has(productId)) return null;
      seen.add(productId);

      lines.push({ productId, quantity });
    }

    return lines.length > 0 ? lines : null;
  } catch {
    return null;
  }
}

export type ResolvedCartLines = {
  items: OrderLineItem[];
  adjustments: CartLineAdjustment[];
};

/**
 * Re-check stock for each cart line. Unavailable lines are dropped; partial stock
 * is capped to what's left. Never fails the whole bag for one bad line.
 */
export async function resolveOrderLineItemsFromCart(
  lines: CartLineInput[],
): Promise<ResolvedCartLines> {
  const items: OrderLineItem[] = [];
  const adjustments: CartLineAdjustment[] = [];

  for (const line of lines) {
    const product = await findProductById(line.productId);
    const name = product ? getProductDisplayName(product) : line.productId;
    const slug = product?.slug ?? line.productId;
    const image = product?.images[0] ?? "";

    if (!product || !product.inStock || product.pieces <= 0) {
      adjustments.push({
        productId: line.productId,
        slug,
        name,
        image,
        removed: true,
        requestedQuantity: line.quantity,
        availableQuantity: 0,
      });
      continue;
    }

    const quantity = Math.min(line.quantity, product.pieces);
    if (quantity < line.quantity) {
      adjustments.push({
        productId: product.id,
        slug: product.slug,
        name: getProductDisplayName(product),
        image: product.images[0] ?? "",
        removed: false,
        requestedQuantity: line.quantity,
        availableQuantity: quantity,
      });
    }

    items.push({
      productId: product.id,
      slug: product.slug,
      name: getProductDisplayName(product),
      price: product.price,
      quantity,
      image: product.images[0] ?? "",
      size: product.sizes?.join(", "),
    });
  }

  return { items, adjustments };
}

/** Strict build — fails if any line cannot be fulfilled exactly (legacy callers). */
export async function buildOrderLineItemsFromCart(
  lines: CartLineInput[],
): Promise<{ items: OrderLineItem[] } | { error: string }> {
  const { items, adjustments } = await resolveOrderLineItemsFromCart(lines);

  if (adjustments.length > 0) {
    const first = adjustments[0]!;
    if (first.removed) {
      return { error: `${first.slug} is out of stock` };
    }
    return {
      error: `Only ${first.availableQuantity} left for ${first.slug}`,
    };
  }

  if (items.length === 0) {
    return { error: "Your bag is empty or invalid" };
  }

  return { items };
}

export function formatCartAdjustmentNotice(
  adjustments: CartLineAdjustment[],
): string {
  if (adjustments.length === 0) return "";

  const parts = adjustments.map((a) => {
    if (a.removed) {
      return `${a.slug} is no longer available and was removed from your bag.`;
    }
    return `${a.slug}: only ${a.availableQuantity} left — quantity updated from ${a.requestedQuantity} to ${a.availableQuantity}.`;
  });

  const summary =
    adjustments.length === 1
      ? parts[0]!
      : parts.map((p) => `• ${p}`).join(" ");

  return `${summary} Review your updated total below, then pay again.`;
}
