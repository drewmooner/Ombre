import Link from "next/link";
import type { Product } from "@/lib/product-types";
import { ProductCard } from "@/components/product-card";

type ShopSearchResultsProps = {
  query: string;
  products: Product[];
};

export function ShopSearchResults({ query, products }: ShopSearchResultsProps) {
  return (
    <div className="shop-search-results">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Search
          </p>
          <h2 className="mt-1 font-display text-2xl font-medium text-[var(--foreground)]">
            Results for &ldquo;{query}&rdquo;
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {products.length}{" "}
            {products.length === 1 ? "product" : "products"} found
          </p>
        </div>
        <Link href="/" className="link-accent text-sm font-medium">
          Clear search
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--muted)]">
          No products match your search. Try another word or{" "}
          <Link href="/" className="link-accent">
            browse all
          </Link>
          .
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
