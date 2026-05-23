"use client";

import Link from "next/link";
import { ProductImage } from "@/components/shop/product-image";
import { useState } from "react";
import { formatNaira } from "@/lib/format-price";
import { getProductDisplayName } from "@/lib/product-display-name";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/product-types";
import { LockIcon } from "./icons";
import { MorphButton } from "./morph-button";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const displayName = getProductDisplayName(product);

  function handleAdd() {
    if (!product.inStock) return;
    addItem(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className="group flex flex-col">
      <Link
        href={`/product/${product.slug}`}
        className="morph-surface relative mb-4 block overflow-hidden rounded-2xl"
      >
        <div className="relative aspect-[3/4] w-full bg-[var(--background-deep)]">
          <ProductImage
            src={product.images[0]}
            alt={displayName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {!product.inStock && (
            <span className="absolute left-3 top-3 rounded-full bg-[var(--foreground)]/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--on-accent)] backdrop-blur-sm">
              Sold out
            </span>
          )}
          {product.compareAtPrice && product.inStock && (
            <span className="absolute right-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-medium text-[var(--on-accent)] shadow-sm">
              Sale
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-0.5">
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="text-[15px] font-semibold leading-snug text-[var(--foreground)]">
            {displayName}
          </h3>
        </Link>

        <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
          {formatNaira(product.price)}
        </p>
        {product.compareAtPrice && (
          <p className="text-sm text-[var(--muted)] line-through">
            {formatNaira(product.compareAtPrice)}
          </p>
        )}

        <div className="mt-4">
          {product.inStock ? (
            <MorphButton
              variant="primary"
              fullWidth
              onClick={handleAdd}
              className="py-3 text-sm"
            >
              {added ? "Added to bag" : "Add to bag"}
            </MorphButton>
          ) : (
            <MorphButton
              fullWidth
              disabled
              className="py-3 text-sm text-[var(--muted)]"
            >
              <LockIcon />
              Out of stock
            </MorphButton>
          )}
        </div>
      </div>
    </article>
  );
}
