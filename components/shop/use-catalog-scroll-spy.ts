"use client";

import { useEffect, useRef } from "react";
import { catalogHeaderId } from "@/lib/shop/catalog-nav";

type UseCatalogScrollSpyOptions = {
  catalogIds: string[];
  activeCatalogId: string;
  onActiveChange: (catalogId: string) => void;
  paused: boolean;
  /** Pixels from viewport top where a section counts as "active" */
  anchorOffset: number;
};

export function useCatalogScrollSpy({
  catalogIds,
  activeCatalogId,
  onActiveChange,
  paused,
  anchorOffset,
}: UseCatalogScrollSpyOptions) {
  const onActiveChangeRef = useRef(onActiveChange);

  useEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  }, [onActiveChange]);

  useEffect(() => {
    if (paused || catalogIds.length === 0 || anchorOffset <= 0) return;

    const headers = catalogIds
      .map((id) => document.getElementById(catalogHeaderId(id)))
      .filter((el): el is HTMLElement => el !== null);

    if (headers.length === 0) return;

    let frame = 0;

    function pickActive() {
      const line = anchorOffset + 4;
      let chosenEl = headers[0];

      for (const el of headers) {
        if (el.getBoundingClientRect().top <= line) {
          chosenEl = el;
        }
      }

      const chosen = chosenEl?.id.replace(/^shop-catalog-/, "") ?? "";
      if (chosen && chosen !== activeCatalogId) {
        onActiveChangeRef.current(chosen);
      }
    }

    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(pickActive);
    }

    pickActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [catalogIds, activeCatalogId, paused, anchorOffset]);
}
