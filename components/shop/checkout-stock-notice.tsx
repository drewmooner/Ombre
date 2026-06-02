"use client";

import Link from "next/link";
import { ProductImage } from "@/components/shop/product-image";
import type { CartLineAdjustment } from "@/lib/checkout/cart-lines";
import type { CartItem } from "@/lib/cart-context";

type CheckoutStockNoticeProps = {
  stockNotice: string;
  adjustments?: CartLineAdjustment[];
  /** Fallback images before the bag syncs (matches by slug). */
  cartItems?: CartItem[];
  className?: string;
};

function adjustmentImage(
  adj: CartLineAdjustment,
  cartItems?: CartItem[],
): string {
  if (adj.image) return adj.image;
  return cartItems?.find((i) => i.slug === adj.slug)?.image ?? "";
}

export function CheckoutStockNotice({
  stockNotice,
  adjustments,
  cartItems,
  className = "",
}: CheckoutStockNoticeProps) {
  const list = adjustments ?? [];

  return (
    <div
      className={`rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm leading-relaxed text-amber-950 ${className}`.trim()}
      role="status"
    >
      <p className="font-medium">Your bag was updated</p>
      <p className="mt-2">{stockNotice}</p>
      {list.length > 0 && (
        <ul className="mt-4 space-y-3">
          {list.map((adj) => {
            const src = adjustmentImage(adj, cartItems);
            return (
              <li
                key={adj.slug}
                className="flex items-center gap-3 rounded-lg border border-amber-200/60 bg-white/60 p-2.5"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-amber-200/50">
                  <ProductImage
                    src={src}
                    alt={adj.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${adj.slug}`}
                    className="font-mono text-sm font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
                  >
                    {adj.slug}
                  </Link>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-900/85">
                    {adj.name}
                  </p>
                  <p className="mt-1 text-xs font-medium text-amber-950/90">
                    {adj.removed
                      ? "Removed — no longer in stock"
                      : `Quantity ${adj.requestedQuantity} → ${adj.availableQuantity}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
