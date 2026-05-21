import type { Product } from "@/lib/product-types";
import { ProductCard } from "./product-card";

type ProductGridProps = {
  products: Product[];
  title?: string;
};

export function ProductGrid({ products, title = "Shop" }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <section id="shop" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
        <p className="text-center text-[var(--muted)]">No products match your search.</p>
      </section>
    );
  }

  return (
    <section id="shop" className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-10">
      {title.startsWith("Results") && (
        <h2 className="mb-6 font-display text-2xl font-medium text-[var(--foreground)]">
          {title}
        </h2>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
