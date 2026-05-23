"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { CatalogWithCount } from "@/lib/catalog-types";
import type { Product } from "@/lib/product-types";
import { catalogHeaderId } from "@/lib/shop/catalog-nav";
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

export type InfiniteProductGridHandle = {
  /** Load pages until the catalog section exists in the feed (or nothing left to load). */
  ensureCatalogSection: (catalogId: string) => Promise<boolean>;
  isCatalogInFeed: (catalogId: string) => boolean;
};

type InfiniteProductGridProps = {
  catalogOrder: CatalogWithCount[];
  initialCatalogId: string;
  initialProducts: Product[];
  initialTotal: number;
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

function feedHasCatalogHeader(feed: FeedItem[], catalogId: string): boolean {
  return feed.some(
    (item) => item.kind === "header" && item.catalogId === catalogId,
  );
}

export const InfiniteProductGrid = forwardRef<
  InfiniteProductGridHandle,
  InfiniteProductGridProps
>(function InfiniteProductGrid(
  {
    catalogOrder,
    initialCatalogId,
    initialProducts,
    initialTotal,
    onActiveCatalogChange,
  },
  ref,
) {
  const firstCatalog =
    catalogOrder.find((c) => c.id === initialCatalogId) ?? catalogOrder[0];

  const [feed, setFeed] = useState<FeedItem[]>(() =>
    firstCatalog ? buildInitialFeed(firstCatalog, initialProducts) : [],
  );
  const [activeCatalogId, setActiveCatalogId] = useState(
    () => firstCatalog?.id ?? "",
  );
  const [catalogTotals, setCatalogTotals] = useState<Record<string, number>>(() =>
    firstCatalog ? { [initialCatalogId]: initialTotal } : {},
  );
  const [catalogLoaded, setCatalogLoaded] = useState<Record<string, number>>(() =>
    firstCatalog ? { [initialCatalogId]: initialProducts.length } : {},
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const feedRef = useRef(feed);
  const catalogLoadedRef = useRef(catalogLoaded);
  const catalogTotalsRef = useRef(catalogTotals);
  const activeCatalogIdRef = useRef(activeCatalogId);
  const reachedEndRef = useRef(reachedEnd);
  const onActiveCatalogChangeRef = useRef(onActiveCatalogChange);

  feedRef.current = feed;
  catalogLoadedRef.current = catalogLoaded;
  catalogTotalsRef.current = catalogTotals;
  activeCatalogIdRef.current = activeCatalogId;
  reachedEndRef.current = reachedEnd;
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
      if (withHeader) {
        syncActiveCatalog(catalog.id);
      }
    },
    [syncActiveCatalog],
  );

  const loadMore = useCallback(async (): Promise<boolean> => {
    if (loadingRef.current || reachedEndRef.current) return false;

    const catalogId = activeCatalogIdRef.current;
    const catalog = catalogOrder.find((c) => c.id === catalogId);
    if (!catalog) return false;

    loadingRef.current = true;
    setLoadingMore(true);
    setError(null);

    try {
      const loaded = catalogLoadedRef.current[catalogId] ?? 0;
      const total = catalogTotalsRef.current[catalogId] ?? 0;

      if (loaded < total) {
        const data = await fetchCatalogPage(catalogId, loaded);
        appendCatalogPage(catalog, data, loaded, false);
        const idx = indexInOrder(catalogOrder, catalogId);
        const next = nextCatalogWithProducts(catalogOrder, idx);
        setReachedEnd(!data.hasMore && !next);
        return true;
      }

      const idx = indexInOrder(catalogOrder, catalogId);
      const next = nextCatalogWithProducts(catalogOrder, idx);
      if (!next) {
        setReachedEnd(true);
        return false;
      }

      const data = await fetchCatalogPage(next.id, 0);
      appendCatalogPage(next, data, 0, true);
      const nextIdx = indexInOrder(catalogOrder, next.id);
      const afterNext = nextCatalogWithProducts(catalogOrder, nextIdx);
      setReachedEnd(!data.hasMore && !afterNext);
      syncActiveCatalog(next.id);
      return true;
    } catch {
      setError("Could not load more products");
      return false;
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [appendCatalogPage, catalogOrder, syncActiveCatalog]);

  useImperativeHandle(
    ref,
    () => ({
      isCatalogInFeed: (catalogId: string) =>
        feedHasCatalogHeader(feedRef.current, catalogId),
      ensureCatalogSection: async (catalogId: string) => {
        if (feedHasCatalogHeader(feedRef.current, catalogId)) return true;

        let guard = 0;
        while (
          !feedHasCatalogHeader(feedRef.current, catalogId) &&
          !reachedEndRef.current &&
          guard < 80
        ) {
          const progressed = await loadMore();
          guard += 1;
          if (!progressed) break;
          await new Promise((r) => setTimeout(r, 0));
        }

        return feedHasCatalogHeader(feedRef.current, catalogId);
      },
    }),
    [loadMore],
  );

  useEffect(() => {
    if (!firstCatalog || feed.length > 0) return;

    let cancelled = false;

    async function bootstrap() {
      loadingRef.current = true;
      setLoadingMore(true);
      setError(null);

      try {
        const idx = indexInOrder(catalogOrder, firstCatalog.id);
        const next = nextCatalogWithProducts(catalogOrder, idx);
        if (next) {
          const nextData = await fetchCatalogPage(next.id, 0);
          if (cancelled) return;
          setCatalogTotals({
            [firstCatalog.id]: 0,
            [next.id]: nextData.total,
          });
          setCatalogLoaded({
            [firstCatalog.id]: 0,
            [next.id]: nextData.products.length,
          });
          setFeed(productsToFeedItems(next.id, next.name, nextData.products, true));
          syncActiveCatalog(next.id);
          const nextIdx = indexInOrder(catalogOrder, next.id);
          const afterNext = nextCatalogWithProducts(catalogOrder, nextIdx);
          setReachedEnd(!nextData.hasMore && !afterNext);
        } else {
          setReachedEnd(true);
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

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [catalogOrder, feed.length, firstCatalog, syncActiveCatalog]);

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
            <li
              key={`header-${item.catalogId}`}
              id={catalogHeaderId(item.catalogId)}
              className="shop-catalog-divider"
            >
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
});

export async function fetchCatalogProductsFirstPage(
  catalogId: string,
): Promise<PagePayload & { limit: number }> {
  return fetchCatalogPage(catalogId, 0) as Promise<
    PagePayload & { limit: number }
  >;
}

export { SHOP_PRODUCTS_PAGE_SIZE };
