"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BrandLogo } from "./brand-logo";
import { SearchIcon } from "./icons";
import { CartLink } from "./shop/cart-link";
import { HeaderAuth } from "./shop/header-auth";
import { OrdersLink } from "./shop/orders-link";
import type { ShopCustomer } from "@/lib/shop-types";

type HeaderProps = {
  customer?: ShopCustomer | null;
  activeOrderCount?: number;
};

export function Header({ customer = null, activeOrderCount = 0 }: HeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="site-header">
      <div className="morph-surface site-header-bar mx-auto grid max-w-7xl grid-cols-1 gap-3 overflow-visible rounded-2xl px-3.5 py-3.5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="site-header-brand flex min-w-0 items-center gap-2 sm:col-start-1 sm:row-start-1"
          aria-label="Ombré home"
        >
          <BrandLogo size="header" priority className="shrink-0" />
          <span className="site-header-brand-name shrink-0 font-display text-xl font-medium tracking-tight sm:text-2xl">
            Ombré
          </span>
        </Link>

        <div className="site-header-actions flex w-full flex-wrap items-center justify-center gap-1.5 overflow-visible sm:col-start-3 sm:row-start-1 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-2">
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

        <form
          onSubmit={onSearch}
          className="relative w-full min-w-0 sm:col-start-2 sm:row-start-1 sm:mx-auto sm:max-w-md"
        >
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
      </div>
    </header>
  );
}
