"use client";

import { useMemo, useState, useTransition } from "react";
import type { CatalogWithCount } from "@/lib/catalog-types";
import type { Product } from "@/lib/product-types";
import { InfiniteProductGrid } from "./shop/infinite-product-grid";

type ShopHomeProps = {
  catalogs: CatalogWithCount[];
  initialCatalogId: string;
  initialProducts: Product[];
  initialTotal: number;
  /** Less top padding when a greeting sits above the grid */
  compactTop?: boolean;
};

export function ShopHome({
  catalogs,
  initialCatalogId,
  initialProducts,
  initialTotal,
  compactTop = false,
}: ShopHomeProps) {
  const sorted = useMemo(
    () => [...catalogs].sort((a, b) => a.name.localeCompare(b.name)),
    [catalogs],
  );

  const [selectedId, setSelectedId] = useState(
    () => sorted.find((c) => c.id === initialCatalogId)?.id ?? sorted[0]?.id ?? "",
  );
  const [resetKey, setResetKey] = useState(0);
  const [pendingCatalog, startCatalogTransition] = useTransition();

  const showPicker = sorted.length > 1;

  function handleCatalogChange(catalogId: string) {
    setSelectedId(catalogId);
    startCatalogTransition(() => {
      setResetKey((k) => k + 1);
    });
  }

  if (sorted.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-10">
        <p className="text-[var(--muted)]">No listings yet.</p>
      </section>
    );
  }

  return (
    <section
      className={
        compactTop
          ? "shop-home-section shop-home-section--compact-top pb-12 sm:pb-14"
          : "shop-home-section pb-12 pt-6 sm:pb-14 sm:pt-8"
      }
    >
      {showPicker && (
        <div className="mb-8 sm:mb-10">
          <label htmlFor="shop-catalog" className="shop-catalog-label">
            Catalog
          </label>
          <select
            id="shop-catalog"
            value={selectedId}
            onChange={(e) => handleCatalogChange(e.target.value)}
            disabled={pendingCatalog}
            className="shop-catalog-select mt-2"
          >
            {sorted.map((catalog) => (
              <option key={catalog.id} value={catalog.id}>
                {catalog.name}
                {catalog.productCount === 0
                  ? " (no products yet)"
                  : ` (${catalog.productCount})`}
              </option>
            ))}
          </select>
        </div>
      )}

      <InfiniteProductGrid
        catalogOrder={sorted}
        anchorCatalogId={selectedId}
        initialProducts={initialProducts}
        initialTotal={initialTotal}
        resetKey={resetKey}
        onActiveCatalogChange={setSelectedId}
      />
    </section>
  );
}
