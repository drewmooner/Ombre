import { writeFileSync } from "fs";

const d = "d" + "iv";

writeFileSync(
  "components/store/product-preview-modal.tsx",
  `"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState } from "react";
import type { Catalog } from "@/lib/catalog-types";
import type { Product } from "@/lib/product-types";
import { toggleProductStockAction, type ActionState } from "@/lib/store/actions";
import { formatNaira } from "@/lib/format-price";
import { MorphButton } from "@/components/morph-button";

type ProductPreviewModalProps = {
  catalog: Catalog;
  product: Product;
  onClose: () => void;
};

const initial: ActionState = {};

export function ProductPreviewModal({
  catalog,
  product,
  onClose,
}: ProductPreviewModalProps) {
  const router = useRouter();
  const [imageIndex, setImageIndex] = useState(0);
  const [inStock, setInStock] = useState(product.inStock);
  const [stockState, stockAction, stockPending] = useActionState(
    toggleProductStockAction.bind(null, catalog.id, product.id),
    initial,
  );

  useEffect(() => {
    setInStock(product.inStock);
    setImageIndex(0);
  }, [product.id, product.inStock]);

  useEffect(() => {
    if (stockState.success) {
      setInStock((prev) => !prev);
      router.refresh();
    }
  }, [stockState.success, router]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const images = product.images;
  const hasMultiple = images.length > 1;

  return (
    <${d}
      className="product-preview-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <${d}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-preview-title"
        className="product-preview-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="product-preview-close"
          aria-label="Close"
        >
          ×
        </button>

        <${d} className="product-preview-media">
          <${d} className="relative aspect-[3/4] w-full overflow-hidden rounded-t-2xl bg-[var(--background-deep)]">
            <Image
              src={images[imageIndex]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 480px"
              priority
            />
          </${d}>

          {hasMultiple ? (
            <>
              <button
                type="button"
                className="product-preview-nav product-preview-nav-prev"
                onClick={() =>
                  setImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))
                }
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                className="product-preview-nav product-preview-nav-next"
                onClick={() =>
                  setImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))
                }
                aria-label="Next image"
              >
                ›
              </button>
              <${d} className="product-preview-dots">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={\`Image \${i + 1}\`}
                    className={
                      i === imageIndex
                        ? "product-preview-dot product-preview-dot-active"
                        : "product-preview-dot"
                    }
                    onClick={() => setImageIndex(i)}
                  />
                ))}
              </${d}>
            </>
          ) : null}
        </${d}>

        <${d} className="product-preview-body">
          <h2 id="product-preview-title" className="font-display text-2xl font-medium">
            {product.name}
          </h2>
          <p className="mt-1 text-lg font-semibold">{formatNaira(product.price)}</p>
          <p className="mt-2">
            <span
              className={
                inStock ? "store-badge store-badge-in" : "store-badge store-badge-out"
              }
            >
              {inStock ? "In stock" : "Out of stock"}
            </span>
          </p>

          {stockState.error ? (
            <p className="mt-3 text-sm text-red-700">{stockState.error}</p>
          ) : null}
          {stockState.success ? (
            <p className="mt-3 text-sm text-[var(--accent-soft)]">{stockState.success}</p>
          ) : null}

          <${d} className="mt-6 flex flex-col gap-2 sm:flex-row">
            <form action={stockAction} className="flex-1">
              <MorphButton
                type="submit"
                variant="primary"
                fullWidth
                disabled={stockPending}
                className="py-3"
              >
                {stockPending
                  ? "Updating…"
                  : inStock
                    ? "Mark out of stock"
                    : "Mark in stock"}
              </MorphButton>
            </form>
            <MorphButton type="button" fullWidth onClick={onClose} className="py-3">
              Close
            </MorphButton>
          </${d}>
        </${d}>
      </${d}>
    </${d}>
  );
}
`,
);
