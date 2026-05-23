"use client";

import { ProductImage } from "@/components/shop/product-image";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState } from "react";
import { useActionSuccess } from "./use-action-success";
import type { Catalog } from "@/lib/catalog-types";
import type { Product } from "@/lib/product-types";
import { toggleProductStockAction, type ActionState } from "@/lib/store/actions";
import { formatNaira } from "@/lib/format-price";

type ProductPreviewModalProps = {
  catalog: Catalog;
  product: Product;
  imageUrl: string;
  onClose: () => void;
};

const initial: ActionState = {};

export function ProductPreviewModal({
  catalog,
  product,
  imageUrl,
  onClose,
}: ProductPreviewModalProps) {
  const router = useRouter();
  const [inStock, setInStock] = useState(product.inStock);
  const [stockState, stockAction, stockPending] = useActionState(
    toggleProductStockAction.bind(null, catalog.id, product.id),
    initial,
  );

  useEffect(() => {
    setInStock(product.inStock);
  }, [product.id, product.inStock]);

  useActionSuccess(stockState.success, stockPending, () => {
    setInStock((prev) => !prev);
    router.refresh();
  });

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

  return (
    <div className="product-lightbox" onClick={onClose} role="presentation">
      <button
        type="button"
        onClick={onClose}
        className="product-lightbox-close"
        aria-label="Close"
      >
        ×
      </button>

      <div
        className="product-lightbox-stage"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
      >
        <div className="product-lightbox-frame">
          <ProductImage
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain"
            sizes="90vw"
            priority
          />
        </div>

      </div>

      <div
        className="product-lightbox-bar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="product-lightbox-bar-text">
          <p className="product-lightbox-name">{product.name}</p>
          <p className="product-lightbox-meta">
            {formatNaira(product.price)}
            {product.sizes && product.sizes.length > 0 ? (
              <>
                <span className="product-lightbox-sep">·</span>
                {product.sizes.join(", ")}
              </>
            ) : null}
            <span className="product-lightbox-sep">·</span>
            <span className={inStock ? "text-emerald-200" : "text-white/60"}>
              {inStock ? `${product.pieces} pcs` : "Out of stock"}
            </span>
          </p>
          {stockState.success ? (
            <p className="mt-1 text-xs text-emerald-200">{stockState.success}</p>
          ) : null}
          {stockState.error ? (
            <p className="mt-1 text-xs text-red-300">{stockState.error}</p>
          ) : null}
        </div>
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
      </div>
    </div>
  );
}
