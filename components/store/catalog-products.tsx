"use client";

import { ProductImage } from "@/components/shop/product-image";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import type { Catalog } from "@/lib/catalog-types";
import type { Product } from "@/lib/product-types";
import {
  deleteProductAction,
  toggleProductStockAction,
  type ActionState,
} from "@/lib/store/actions";
import { formatNaira } from "@/lib/format-price";
import { MorphButton } from "@/components/morph-button";
import { ProductForm } from "./product-form";
import { ProductPreviewModal } from "./product-preview-modal";
import { useToast } from "@/components/ui/toast";
import { useActionSuccess } from "./use-action-success";

type CatalogProductsProps = {
  catalog: Catalog;
  products: Product[];
};

const initial: ActionState = {};

function ProductRow({
  catalog,
  product,
  onPreview,
  onStatus,
}: {
  catalog: Catalog;
  product: Product;
  onPreview: (imageUrl: string) => void;
  onStatus: (state: ActionState) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteProductAction.bind(null, catalog.id, product.id),
    initial,
  );
  const [stockState, stockAction, stockPending] = useActionState(
    toggleProductStockAction.bind(null, catalog.id, product.id),
    initial,
  );

  const pending = deletePending || stockPending;
  const successMsg = deleteState.success || stockState.success;
  const err = deleteState.error || stockState.error;

  useActionSuccess(successMsg, pending, () => {
    setConfirmDelete(false);
    const message = deleteState.success ?? stockState.success;
    if (message) toast.success(message);
    if (deleteState.success || stockState.success) {
      onStatus({
        success: deleteState.success ?? stockState.success,
        error: deleteState.error ?? stockState.error,
      });
    }
    router.refresh();
  });

  useActionSuccess(err, pending, () => {
    if (err) toast.error(err);
  });

  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onPreview(product.images[0])}
            className="relative block h-14 w-11 shrink-0 overflow-hidden rounded-lg ring-offset-2 transition hover:ring-2 hover:ring-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            aria-label={`Preview ${product.name}`}
          >
            <ProductImage
              src={product.images[0]}
              alt=""
              fill
              className="object-cover"
              sizes="44px"
            />
          </button>
          <span className="min-w-0">
            <span className="block font-medium">{product.name}</span>
            <span className="mt-0.5 block font-mono text-[11px] text-[var(--muted)] sm:hidden">
              /{product.slug}
            </span>
          </span>
        </div>
      </td>
      <td className="hidden font-medium sm:table-cell">{formatNaira(product.price)}</td>
      <td className="hidden sm:table-cell">
        <span
          className={
            product.inStock
              ? "store-badge store-badge-in"
              : "store-badge store-badge-out"
          }
        >
          {product.inStock ? `${product.pieces} pcs` : "Out of stock"}
        </span>
      </td>
      <td>
        {successMsg && (
          <p className="mb-2 text-right text-xs text-emerald-800">{successMsg}</p>
        )}
        {err && <p className="mb-2 text-right text-xs text-red-700">{err}</p>}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!confirmDelete ? (
            <>
              <MorphButton
                href={`/store/catalogs/${catalog.id}/products/${product.id}/edit`}
                className="!px-3 !py-1.5 text-xs"
              >
                Edit
              </MorphButton>
              <form action={stockAction}>
                <MorphButton
                  type="submit"
                  disabled={stockPending}
                  className="!px-3 !py-1.5 text-xs"
                >
                  {stockPending ? "…" : product.inStock ? "Mark out" : "Mark in"}
                </MorphButton>
              </form>
              <MorphButton
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="!px-3 !py-1.5 text-xs text-red-800"
              >
                Delete
              </MorphButton>
            </>
          ) : (
            <>
              <form action={deleteAction}>
                <MorphButton
                  type="submit"
                  variant="primary"
                  disabled={deletePending}
                  className="!px-3 !py-1.5 text-xs"
                >
                  {deletePending ? "…" : "Confirm"}
                </MorphButton>
              </form>
              <MorphButton
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="!px-3 !py-1.5 text-xs"
              >
                Cancel
              </MorphButton>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export function CatalogProducts({ catalog, products }: CatalogProductsProps) {
  const [showAdd, setShowAdd] = useState(products.length === 0);
  const [listNotice, setListNotice] = useState<ActionState>({});
  const [preview, setPreview] = useState<{
    productId: string;
    imageUrl: string;
  } | null>(null);
  const previewProduct =
    products.find((p) => p.id === preview?.productId) ?? null;

  return (
    <div className="space-y-10">
      {previewProduct && preview ? (
        <ProductPreviewModal
          catalog={catalog}
          product={previewProduct}
          imageUrl={preview.imageUrl}
          onClose={() => setPreview(null)}
        />
      ) : null}
      <section className="store-card overflow-hidden">
        {(listNotice.success || listNotice.error) && (
          <div className="border-b border-[rgba(var(--accent-rgb),0.08)] px-5 py-3 sm:px-6">
            {listNotice.success && (
              <p className="store-alert store-alert-success !mb-0">{listNotice.success}</p>
            )}
            {listNotice.error && (
              <p className="store-alert store-alert-error !mb-0">{listNotice.error}</p>
            )}
          </div>
        )}

        <header className="store-card-header flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide">Products</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {products.length} listing{products.length === 1 ? "" : "s"} · default{" "}
              {formatNaira(catalog.defaultPrice)}
            </p>
          </div>
          <MorphButton
            type="button"
            variant="primary"
            className="!px-4 !py-2 text-xs"
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? "Hide form" : "+ Add product"}
          </MorphButton>
        </header>

        {showAdd && (
          <div className="border-b border-[rgba(var(--accent-rgb),0.08)] p-5 sm:p-6">
            <ProductForm
              catalog={catalog}
              existingSlugs={products.map((p) => p.slug)}
            />
          </div>
        )}

        {products.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-[var(--muted)]">
            No products yet. Add one above.
          </p>
        ) : (
          <table className="store-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="hidden sm:table-cell">Price</th>
                <th className="hidden sm:table-cell">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  catalog={catalog}
                  product={product}
                  onPreview={(imageUrl) =>
                    setPreview({ productId: product.id, imageUrl })
                  }
                  onStatus={setListNotice}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
