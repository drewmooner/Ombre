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
      <div className="morph-surface site-header-bar mx-auto flex max-w-7xl flex-col gap-4 overflow-visible rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Ombré home"
        >
          <span className="morph-btn brand-mark flex h-11 w-11 items-center justify-center rounded-xl font-display text-xl font-semibold">
            O
          </span>
          <span className="site-header-brand-name hidden font-display text-2xl font-medium tracking-tight sm:inline">
            Ombré
          </span>
        </Link>

        <form
          onSubmit={onSearch}
          className="relative order-3 w-full sm:order-none sm:mx-auto sm:max-w-md sm:flex-1"
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

        <div className="order-2 flex items-center justify-end gap-3 overflow-visible sm:order-none sm:shrink-0">
          <span
            className="morph-btn site-header-pill flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium"
            title="Nigeria · NGN only"
          >
            <span aria-hidden>🇳🇬</span>
            <span>NGN</span>
          </span>

          <HeaderAuth customer={customer} />

          <CartLink className="morph-btn site-header-cart relative flex h-11 w-11 items-center justify-center rounded-full" />
        </div>
      </div>
    </header>
  );
}
