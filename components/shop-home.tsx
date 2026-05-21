"use client";

import { useMemo, useState } from "react";
import type { CatalogWithProducts } from "@/lib/catalog-types";
import { ProductCard } from "./product-card";

type ShopHomeProps = {
  catalogs: CatalogWithProducts[];
};

export function ShopHome({ catalogs }: ShopHomeProps) {
  const sorted = useMemo(
    () => [...catalogs].sort((a, b) => a.name.localeCompare(b.name)),
    [catalogs],
  );

  const [selectedId, setSelectedId] = useState(() => sorted[0]?.id ?? "");

  const selected = sorted.find((c) => c.id === selectedId) ?? sorted[0];
  const showPicker = sorted.length > 1;

  if (sorted.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-10">
        <p className="text-[var(--muted)]">No listings yet.</p>
      </section>
    );
  }

  if (!selected) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-10">
      {showPicker && (
        <div className="mb-8 sm:mb-10">
          <label htmlFor="shop-catalog" className="shop-catalog-label">
            Catalog
          </label>
          <select
            id="shop-catalog"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="shop-catalog-select mt-2"
          >
            {sorted.map((catalog) => (
              <option key={catalog.id} value={catalog.id}>
                {catalog.name}
                {catalog.products.length === 0
                  ? " (no products yet)"
                  : ` (${catalog.products.length})`}
              </option>
            ))}
          </select>
        </div>
      )}

      {selected.products.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--muted)]">
          No products in {selected.name} yet.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
          {selected.products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
