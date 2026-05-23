"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogWithCount, CatalogWithProducts } from "@/lib/catalog-types";
import { compareCatalogs } from "@/lib/catalog-order";
import { catalogHeaderId } from "@/lib/shop/catalog-nav";
import {
  filterProductsByQuery,
  flattenCatalogProducts,
} from "@/lib/shop/search-products";
import { CatalogProductFeed } from "@/components/shop/catalog-product-feed";
import { ShopSearchResults } from "@/components/shop/shop-search-results";
import { useRegisterShopCatalogNav } from "@/components/shop/shop-catalog-nav-context";
import { useCatalogScrollSpy } from "@/components/shop/use-catalog-scroll-spy";

type ShopHomeProps = {
  catalogSections: CatalogWithProducts[];
  searchQuery?: string;
  /** Less top padding when a greeting sits above the grid */
  compactTop?: boolean;
};

function toCatalogWithCount(catalog: CatalogWithProducts): CatalogWithCount {
  return {
    id: catalog.id,
    slug: catalog.slug,
    name: catalog.name,
    image: catalog.image,
    defaultPrice: catalog.defaultPrice,
    defaultProductName: catalog.defaultProductName,
    sortOrder: catalog.sortOrder,
    productCount: catalog.products.length,
  };
}

export function ShopHome({
  catalogSections,
  searchQuery = "",
  compactTop = false,
}: ShopHomeProps) {
  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;

  const sections = useMemo(
    () =>
      [...catalogSections]
        .filter((c) => c.products.length > 0)
        .sort(compareCatalogs),
    [catalogSections],
  );

  const visibleCatalogs = useMemo(
    () => sections.map(toCatalogWithCount),
    [sections],
  );

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return filterProductsByQuery(
      flattenCatalogProducts(catalogSections),
      trimmedQuery,
    );
  }, [catalogSections, isSearching, trimmedQuery]);

  const [activeCatalogId, setActiveCatalogId] = useState(
    () => visibleCatalogs[0]?.id ?? "",
  );
  const [scrollAnchorOffset, setScrollAnchorOffset] = useState(0);
  const [spyPaused, setSpyPaused] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const catalogIds = useMemo(
    () => visibleCatalogs.map((c) => c.id),
    [visibleCatalogs],
  );

  useCatalogScrollSpy({
    catalogIds,
    activeCatalogId,
    onActiveChange: setActiveCatalogId,
    paused: spyPaused || isSearching,
    anchorOffset: scrollAnchorOffset,
  });

  const measureStickyOffsets = useCallback(() => {
    const siteHeader = document.querySelector<HTMLElement>(".site-header");
    const offset = Math.ceil((siteHeader?.getBoundingClientRect().height ?? 0) + 8);
    setScrollAnchorOffset(offset);

    if (sectionRef.current) {
      sectionRef.current.style.setProperty(
        "--shop-scroll-anchor",
        `${offset}px`,
      );
    }
  }, []);

  useEffect(() => {
    measureStickyOffsets();
    const siteHeader = document.querySelector(".site-header");
    const ro = new ResizeObserver(() => measureStickyOffsets());
    if (siteHeader) ro.observe(siteHeader);
    window.addEventListener("resize", measureStickyOffsets, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureStickyOffsets);
    };
  }, [measureStickyOffsets, visibleCatalogs.length, isSearching]);

  const scrollToCatalog = useCallback((catalogId: string) => {
    setSpyPaused(true);
    setActiveCatalogId(catalogId);

    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);

    const el = document.getElementById(catalogHeaderId(catalogId));
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    scrollEndTimerRef.current = setTimeout(() => {
      setSpyPaused(false);
      scrollEndTimerRef.current = null;
    }, 700);
  }, []);

  useEffect(
    () => () => {
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    },
    [],
  );

  useRegisterShopCatalogNav(
    !isSearching && visibleCatalogs.length > 0
      ? {
          catalogs: visibleCatalogs,
          activeCatalogId,
          onSelect: scrollToCatalog,
        }
      : null,
    [visibleCatalogs, activeCatalogId, scrollToCatalog, isSearching],
  );

  if (sections.length === 0 && !isSearching) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-10">
        <p className="text-[var(--muted)]">No products yet.</p>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={
        compactTop
          ? "shop-home-section shop-home-section--compact-top pb-12 sm:pb-14"
          : "shop-home-section pb-12 pt-6 sm:pb-14 sm:pt-8"
      }
    >
      {isSearching ? (
        <ShopSearchResults query={trimmedQuery} products={searchResults} />
      ) : (
        <CatalogProductFeed catalogs={sections} />
      )}
    </section>
  );
}
