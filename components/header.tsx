"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SearchIcon } from "./icons";
import { CartLink } from "./shop/cart-link";
import { HeaderAuth } from "./shop/header-auth";
import type { ShopCustomer } from "@/lib/shop-types";

type HeaderProps = {
  customer?: ShopCustomer | null;
};

export function Header({ customer = null }: HeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="site-header">
      <div className="morph-surface site-header-bar mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-3 overflow-visible rounded-2xl px-3 py-3 sm:grid-cols-[auto_1fr_auto] sm:gap-4 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="col-start-1 row-start-1 flex min-w-0 shrink-0 items-center gap-2"
          aria-label="Ombré home"
        >
          <span className="morph-btn brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-lg font-semibold sm:h-11 sm:w-11 sm:text-xl">
            O
          </span>
          <span className="site-header-brand-name truncate font-display text-xl font-medium tracking-tight sm:text-2xl">
            Ombré
          </span>
        </Link>

        <form
          onSubmit={onSearch}
          className="relative col-span-2 row-start-2 w-full min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:mx-auto sm:max-w-md"
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

        <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 overflow-visible sm:col-start-3 sm:gap-3">
          <span
            className="morph-btn site-header-pill flex h-10 min-w-10 items-center justify-center gap-1 rounded-full px-2.5 text-xs font-medium sm:min-w-0 sm:px-3 sm:py-2"
            title="Nigeria · NGN only"
          >
            <span aria-hidden>🇳🇬</span>
            <span className="hidden min-[400px]:inline">NGN</span>
          </span>

          <HeaderAuth customer={customer} />

          <CartLink className="morph-btn site-header-cart relative flex h-11 w-11 items-center justify-center rounded-full" />
        </div>
      </div>
    </header>
  );
}
