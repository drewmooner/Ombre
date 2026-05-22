import type { OrderLineItem } from "@/lib/order-types";
import { getProductDisplayName } from "@/lib/product-display-name";
import { findProductById } from "@/lib/product-store";

/** Only product id + quantity come from the browser — never price. */
export type CartLineInput = {
  productId: string;
  quantity: number;
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

/** Load catalog prices from the database — client-submitted prices are ignored. */
export async function buildOrderLineItemsFromCart(
  lines: CartLineInput[],
): Promise<{ items: OrderLineItem[] } | { error: string }> {
  const items: OrderLineItem[] = [];

  for (const line of lines) {
    const product = await findProductById(line.productId);
    if (!product) {
      return { error: "An item in your bag is no longer available" };
    }
    if (!product.inStock || product.pieces < line.quantity) {
      return {
        error:
          product.pieces === 0
            ? `${product.name} is out of stock`
            : `Only ${product.pieces} left for ${product.name}`,
      };
    }

    items.push({
      productId: product.id,
      slug: product.slug,
      name: getProductDisplayName(product),
      price: product.price,
      quantity: line.quantity,
      image: product.images[0] ?? "",
      size: product.sizes?.join(", "),
    });
  }

  return { items };
}
