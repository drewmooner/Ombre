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
      if (e.key === "ArrowLeft" && product.images.length > 1) {
        setImageIndex((i) => (i === 0 ? product.images.length - 1 : i - 1));
      }
      if (e.key === "ArrowRight" && product.images.length > 1) {
        setImageIndex((i) => (i === product.images.length - 1 ? 0 : i + 1));
      }
    },
    [onClose, product.images.length],
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
    <${d} className="product-lightbox" onClick={onClose} role="presentation">
      <button
        type="button"
        onClick={onClose}
        className="product-lightbox-close"
        aria-label="Close"
      >
        ×
      </button>

      <${d}
        className="product-lightbox-stage"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
      >
        <${d} className="product-lightbox-frame">
          <Image
            src={images[imageIndex]}
            alt={product.name}
            fill
            className="object-contain"
            sizes="90vw"
            priority
          />
        </${d}>

        {hasMultiple ? (
          <>
            <button
              type="button"
              className="product-lightbox-nav product-lightbox-nav-prev"
              onClick={() =>
                setImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))
              }
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              className="product-lightbox-nav product-lightbox-nav-next"
              onClick={() =>
                setImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))
              }
              aria-label="Next image"
            >
              ›
            </button>
            <${d} className="product-lightbox-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={\`Image \${i + 1}\`}
                  className={
                    i === imageIndex
                      ? "product-lightbox-dot product-lightbox-dot-active"
                      : "product-lightbox-dot"
                  }
                  onClick={() => setImageIndex(i)}
                />
              ))}
            </${d}>
          </>
        ) : null}
      </${d}>

      <${d}
        className="product-lightbox-bar"
        onClick={(e) => e.stopPropagation()}
      >
        <${d} className="product-lightbox-bar-text">
          <p className="product-lightbox-name">{product.name}</p>
          <p className="product-lightbox-meta">
            {formatNaira(product.price)}
            <span className="product-lightbox-sep">·</span>
            <span className={inStock ? "text-emerald-200" : "text-white/60"}>
              {inStock ? "In stock" : "Out of stock"}
            </span>
          </p>
          {stockState.error ? (
            <p className="mt-1 text-xs text-red-300">{stockState.error}</p>
          ) : null}
        </${d}>
        <form action={stockAction}>
          <button
            type="submit"
            disabled={stockPending}
            className="product-lightbox-stock-btn"
          >
            {stockPending
              ? "…"
              : inStock
                ? "Mark out"
                : "Mark in"}
          </button>
        </form>
      </${d}>
    </${d}>
  );
}
`,
);
