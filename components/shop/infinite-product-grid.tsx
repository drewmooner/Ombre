"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CatalogWithCount } from "@/lib/catalog-types";
import type { Product } from "@/lib/product-types";
import { SHOP_PRODUCTS_PAGE_SIZE } from "@/lib/shop/pagination";
import { ProductCard } from "@/components/product-card";

type PagePayload = {
  products: Product[];
  total: number;
  hasMore: boolean;
};

type FeedItem =
  | { kind: "header"; catalogId: string; catalogName: string }
  | { kind: "product"; product: Product };

type InfiniteProductGridProps = {
  catalogOrder: CatalogWithCount[];
  anchorCatalogId: string;
  initialProducts: Product[];
  initialTotal: number;
  /** Bumps when the shopper picks a catalog from the dropdown (resets the feed). */
  resetKey: number;
  onActiveCatalogChange: (catalogId: string) => void;
};

async function fetchCatalogPage(
  catalogId: string,
  offset: number,
): Promise<PagePayload> {
  const params = new URLSearchParams({
    catalogId,
    offset: String(offset),
  });
  const res = await fetch(`/api/shop/catalog-products?${params}`);
  if (!res.ok) {
    throw new Error("Could not load products");
  }
  return res.json() as Promise<PagePayload>;
}

function indexInOrder(catalogOrder: CatalogWithCount[], catalogId: string): number {
  return catalogOrder.findIndex((c) => c.id === catalogId);
}

function nextCatalogWithProducts(
  catalogOrder: CatalogWithCount[],
  fromIndex: number,
): CatalogWithCount | null {
  for (let i = fromIndex + 1; i < catalogOrder.length; i += 1) {
    if (catalogOrder[i].productCount > 0) return catalogOrder[i];
  }
  return null;
}

function productsToFeedItems(
  catalogId: string,
  catalogName: string,
  products: Product[],
  includeHeader: boolean,
): FeedItem[] {
  const items: FeedItem[] = [];
  if (includeHeader) {
    items.push({ kind: "header", catalogId, catalogName });
  }
  for (const product of products) {
    items.push({ kind: "product", product });
  }
  return items;
}

function buildInitialFeed(
  catalog: CatalogWithCount,
  products: Product[],
): FeedItem[] {
  return productsToFeedItems(catalog.id, catalog.name, products, true);
}

export function InfiniteProductGrid({
  catalogOrder,
  anchorCatalogId,
  initialProducts,
  initialTotal,
  resetKey,
  onActiveCatalogChange,
}: InfiniteProductGridProps) {
  const anchorCatalog =
    catalogOrder.find((c) => c.id === anchorCatalogId) ?? catalogOrder[0];

  const [feed, setFeed] = useState<FeedItem[]>(() =>
    anchorCatalog ? buildInitialFeed(anchorCatalog, initialProducts) : [],
  );
  const [activeCatalogId, setActiveCatalogId] = useState(anchorCatalogId);
  const [catalogTotals, setCatalogTotals] = useState<Record<string, number>>(() =>
    anchorCatalogId ? { [anchorCatalogId]: initialTotal } : {},
  );
  const [catalogLoaded, setCatalogLoaded] = useState<Record<string, number>>(() =>
    anchorCatalogId ? { [anchorCatalogId]: initialProducts.length } : {},
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const onActiveCatalogChangeRef = useRef(onActiveCatalogChange);
  onActiveCatalogChangeRef.current = onActiveCatalogChange;

  const activeIndex = indexInOrder(catalogOrder, activeCatalogId);
  const activeLoaded = catalogLoaded[activeCatalogId] ?? 0;
  const activeTotal = catalogTotals[activeCatalogId] ?? 0;
  const hasMoreInCatalog = activeLoaded < activeTotal;
  const nextCatalog =
    activeIndex >= 0 ? nextCatalogWithProducts(catalogOrder, activeIndex) : null;
  const canLoadMore = hasMoreInCatalog || Boolean(nextCatalog);

  const syncActiveCatalog = useCallback((catalogId: string) => {
    setActiveCatalogId(catalogId);
    onActiveCatalogChangeRef.current(catalogId);
  }, []);

  const appendCatalogPage = useCallback(
    (
      catalog: CatalogWithCount,
      data: PagePayload,
      offset: number,
      withHeader: boolean,
    ) => {
      setCatalogTotals((prev) => ({ ...prev, [catalog.id]: data.total }));
      setCatalogLoaded((prev) => ({
        ...prev,
        [catalog.id]: offset + data.products.length,
      }));
      setFeed((prev) => [
        ...prev,
        ...productsToFeedItems(catalog.id, catalog.name, data.products, withHeader),
      ]);
      syncActiveCatalog(catalog.id);
    },
    [syncActiveCatalog],
  );

  useEffect(() => {
    if (!anchorCatalog) return;

    let cancelled = false;

    async function resetFeed() {
      loadingRef.current = true;
      setLoadingMore(true);
      setError(null);
      setReachedEnd(false);

      try {
        const data =
          resetKey === 0 && anchorCatalog!.id === anchorCatalogId
            ? { products: initialProducts, total: initialTotal, hasMore: initialTotal > initialProducts.length }
            : await fetchCatalogPage(anchorCatalog!.id, 0);

        if (cancelled) return;

        setCatalogTotals({ [anchorCatalog!.id]: data.total });
        setCatalogLoaded({ [anchorCatalog!.id]: data.products.length });
        setActiveCatalogId(anchorCatalog!.id);
        onActiveCatalogChangeRef.current(anchorCatalog!.id);

        if (data.products.length === 0) {
          const next = nextCatalogWithProducts(
            catalogOrder,
            indexInOrder(catalogOrder, anchorCatalog!.id),
          );
          if (next) {
            const nextData = await fetchCatalogPage(next.id, 0);
            if (cancelled) return;
            setCatalogTotals({
              [anchorCatalog!.id]: 0,
              [next.id]: nextData.total,
            });
            setCatalogLoaded({
              [anchorCatalog!.id]: 0,
              [next.id]: nextData.products.length,
            });
            setFeed(
              productsToFeedItems(next.id, next.name, nextData.products, true),
            );
            syncActiveCatalog(next.id);
            setReachedEnd(!nextData.hasMore && !nextCatalogWithProducts(catalogOrder, indexInOrder(catalogOrder, next.id)));
          } else {
            setFeed([]);
            setReachedEnd(true);
          }
        } else {
          setFeed(buildInitialFeed(anchorCatalog!, data.products));
          const idx = indexInOrder(catalogOrder, anchorCatalog!.id);
          const next = nextCatalogWithProducts(catalogOrder, idx);
          setReachedEnd(!data.hasMore && !next);
        }
      } catch {
        if (!cancelled) setError("Could not load products");
      } finally {
        if (!cancelled) {
          loadingRef.current = false;
          setLoadingMore(false);
        }
      }
    }

    void resetFeed();
    return () => {
      cancelled = true;
    };
  }, [resetKey, anchorCatalogId, catalogOrder, initialProducts, initialTotal, syncActiveCatalog]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !canLoadMore) return;

    const catalog = catalogOrder.find((c) => c.id === activeCatalogId);
    if (!catalog) return;

    loadingRef.current = true;
    setLoadingMore(true);
    setError(null);

    try {
      const loaded = catalogLoaded[activeCatalogId] ?? 0;
      const total = catalogTotals[activeCatalogId] ?? 0;

      if (loaded < total) {
        const data = await fetchCatalogPage(activeCatalogId, loaded);
        appendCatalogPage(catalog, data, loaded, false);
        const idx = indexInOrder(catalogOrder, activeCatalogId);
        const next = nextCatalogWithProducts(catalogOrder, idx);
        setReachedEnd(!data.hasMore && !next);
        return;
      }

      const idx = indexInOrder(catalogOrder, activeCatalogId);
      const next = nextCatalogWithProducts(catalogOrder, idx);
      if (!next) {
        setReachedEnd(true);
        return;
      }

      const data = await fetchCatalogPage(next.id, 0);
      appendCatalogPage(next, data, 0, true);
      const nextIdx = indexInOrder(catalogOrder, next.id);
      const afterNext = nextCatalogWithProducts(catalogOrder, nextIdx);
      setReachedEnd(!data.hasMore && !afterNext);
    } catch {
      setError("Could not load more products");
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [
    activeCatalogId,
    appendCatalogPage,
    canLoadMore,
    catalogLoaded,
    catalogOrder,
    catalogTotals,
  ]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !canLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, loadMore]);

  if (feed.length === 0 && !loadingMore) {
    return (
      <p className="py-12 text-center text-sm text-[var(--muted)]">
        No products yet.
      </p>
    );
  }

  return (
    <div className="shop-infinite-grid">
      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
        {feed.map((item) =>
          item.kind === "header" ? (
            <li key={`header-${item.catalogId}`} className="shop-catalog-divider">
              <h2 className="shop-catalog-divider__title">{item.catalogName}</h2>
            </li>
          ) : (
            <li key={item.product.id}>
              <ProductCard product={item.product} />
            </li>
          ),
        )}
      </ul>

      {error && (
        <p className="mt-6 text-center text-sm text-red-700" role="alert">
          {error}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => void loadMore()}
          >
            Retry
          </button>
        </p>
      )}

      <div ref={sentinelRef} className="shop-infinite-sentinel" aria-hidden>
        {loadingMore && (
          <p className="text-center text-sm text-[var(--muted)]">Loading more…</p>
        )}
        {reachedEnd && feed.length > 0 && !loadingMore && (
          <p className="text-center text-xs text-[var(--muted)]">
            You&apos;ve seen everything
          </p>
        )}
      </div>
    </div>
  );
}

export async function fetchCatalogProductsFirstPage(
  catalogId: string,
): Promise<PagePayload & { limit: number }> {
  return fetchCatalogPage(catalogId, 0) as Promise<
    PagePayload & { limit: number }
  >;
}

export { SHOP_PRODUCTS_PAGE_SIZE };
