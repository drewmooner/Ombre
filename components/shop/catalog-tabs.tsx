"use client";

import { useEffect, useRef } from "react";
import type { CatalogWithCount } from "@/lib/catalog-types";

type CatalogTabsProps = {
  catalogs: CatalogWithCount[];
  activeCatalogId: string;
  onSelect: (catalogId: string) => void;
};

export function CatalogTabs({
  catalogs,
  activeCatalogId,
  onSelect,
}: CatalogTabsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    const tab = tabRefs.current.get(activeCatalogId);
    const scroller = scrollerRef.current;
    if (!tab || !scroller) return;

    const tabLeft = tab.offsetLeft;
    const tabRight = tabLeft + tab.offsetWidth;
    const viewLeft = scroller.scrollLeft;
    const viewRight = viewLeft + scroller.clientWidth;

    if (tabLeft < viewLeft) {
      scroller.scrollTo({ left: tabLeft - 12, behavior: "smooth" });
    } else if (tabRight > viewRight) {
      scroller.scrollTo({
        left: tabRight - scroller.clientWidth + 12,
        behavior: "smooth",
      });
    }
  }, [activeCatalogId]);

  if (catalogs.length === 0) return null;

  return (
    <nav className="shop-catalog-tabs__nav" aria-label="Catalogs">
      <div ref={scrollerRef} className="shop-catalog-tabs__scroller">
        {catalogs.map((catalog) => {
          const active = catalog.id === activeCatalogId;
          return (
            <button
              key={catalog.id}
              ref={(el) => {
                if (el) tabRefs.current.set(catalog.id, el);
                else tabRefs.current.delete(catalog.id);
              }}
              type="button"
              className={
                active
                  ? "shop-catalog-tabs__tab shop-catalog-tabs__tab--active"
                  : "shop-catalog-tabs__tab"
              }
              aria-current={active ? "true" : undefined}
              onClick={() => onSelect(catalog.id)}
            >
              {catalog.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
