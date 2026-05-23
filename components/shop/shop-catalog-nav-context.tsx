"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CatalogWithCount } from "@/lib/catalog-types";

export type ShopCatalogNavState = {
  catalogs: CatalogWithCount[];
  activeCatalogId: string;
  onSelect: (catalogId: string) => void;
};

type ShopCatalogNavContextValue = {
  nav: ShopCatalogNavState | null;
  setNav: (nav: ShopCatalogNavState | null) => void;
};

const ShopCatalogNavContext = createContext<ShopCatalogNavContextValue | null>(
  null,
);

export function ShopCatalogNavProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<ShopCatalogNavState | null>(null);
  const value = useMemo(() => ({ nav, setNav }), [nav]);
  return (
    <ShopCatalogNavContext.Provider value={value}>
      {children}
    </ShopCatalogNavContext.Provider>
  );
}

export function useShopCatalogNav(): ShopCatalogNavState | null {
  return useContext(ShopCatalogNavContext)?.nav ?? null;
}

/** Register catalog tabs on the shop header (home page only). Clears on unmount. */
export function useRegisterShopCatalogNav(
  nav: ShopCatalogNavState | null,
  deps: unknown[],
) {
  const ctx = useContext(ShopCatalogNavContext);
  if (!ctx) {
    throw new Error(
      "useRegisterShopCatalogNav must be used within ShopCatalogNavProvider",
    );
  }

  useEffect(() => {
    ctx.setNav(nav);
    return () => ctx.setNav(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls when nav updates
  }, deps);
}
