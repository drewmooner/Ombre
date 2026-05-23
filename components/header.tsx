"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BrandLogo } from "./brand-logo";
import { SearchIcon } from "./icons";
import { CartLink } from "./shop/cart-link";
import { HeaderAuth } from "./shop/header-auth";
import { CatalogTabs } from "./shop/catalog-tabs";
import { useShopCatalogNav } from "./shop/shop-catalog-nav-context";
import { OrdersLink } from "./shop/orders-link";
import type { ShopCustomer } from "@/lib/shop-types";

type HeaderProps = {
  customer?: ShopCustomer | null;
  activeOrderCount?: number;
};

export function Header({ customer = null, activeOrderCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const catalogNav = useShopCatalogNav();
  const onHome = pathname === "/";
  const urlQuery = onHome ? (searchParams.get("q") ?? "").trim() : "";
  const showCatalogTabs =
    onHome &&
    !urlQuery &&
    catalogNav !== null &&
    catalogNav.catalogs.length > 1;

  useEffect(() => {
    if (onHome) setQuery(urlQuery);
  }, [onHome, urlQuery]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <header
      className={
        showCatalogTabs ? "site-header site-header--with-catalogs" : "site-header"
      }
    >
      <div
        className={
          showCatalogTabs
            ? "morph-surface site-header-bar site-header-bar--with-catalogs mx-auto max-w-7xl px-3.5 py-3.5 sm:px-6 sm:py-3"
            : "morph-surface site-header-bar mx-auto grid max-w-7xl grid-cols-1 gap-3 overflow-visible rounded-2xl px-3.5 py-3.5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4 sm:px-6 sm:py-3"
        }
      >
        <Link
          href="/"
          className="site-header-brand flex min-w-0 items-center gap-2"
          aria-label="Ombré home"
        >
          <BrandLogo size="header" priority className="shrink-0" />
          <span className="site-header-brand-name shrink-0 font-display text-xl font-medium tracking-tight sm:text-2xl">
            Ombré
          </span>
        </Link>

        <div className="site-header-actions flex flex-wrap items-center justify-center gap-1.5 overflow-visible sm:justify-end sm:gap-2">
          <span
            className="site-header-pill morph-btn inline-flex shrink-0 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[0.625rem] font-semibold tracking-wide sm:px-2.5 sm:py-2 sm:text-xs"
            title="Nigeria · NGN only"
          >
            <span aria-hidden>🇳🇬</span>
            <span>NGN</span>
          </span>

          <HeaderAuth customer={customer} />

          <OrdersLink
            signedIn={Boolean(customer)}
            activeOrderCount={activeOrderCount}
          />

          <CartLink />
        </div>

        <div className="site-header-center">
          <form onSubmit={onSearch} className="site-header-search relative w-full">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="morph-input w-full rounded-full py-2.5 pl-4 pr-11 text-sm text-[var(--foreground)]"
              aria-label="Search products"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
              aria-label="Submit search"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>

          {showCatalogTabs ? (
            <div className="site-header-catalog-tabs">
              <CatalogTabs
                catalogs={catalogNav.catalogs}
                activeCatalogId={catalogNav.activeCatalogId}
                onSelect={catalogNav.onSelect}
              />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
