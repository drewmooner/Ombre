import Link from "next/link";
import { ProductImage } from "@/components/shop/product-image";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { SaveProductImageButton } from "@/components/shop/save-product-image-button";
import { MorphButton } from "@/components/morph-button";
import { formatNaira } from "@/lib/format-price";
import { getProductDisplayName } from "@/lib/product-display-name";
import { getProductBySlug } from "@/lib/products.server";
import {
  buildProductInquiryMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const displayName = getProductDisplayName(product);

  return (
    <div className="shop-page mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
      <Link
        href="/"
        className="link-accent mb-8 inline-block text-sm text-[var(--muted)] transition-colors"
      >
        ← Back to shop
      </Link>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="morph-surface overflow-hidden rounded-3xl">
          <div className="relative aspect-[3/4] w-full bg-[var(--background-deep)]">
            <ProductImage
              src={product.images[0]}
              alt={displayName}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain"
            />
            <SaveProductImageButton
              imageUrl={product.images[0]}
              filename={product.slug}
            />
          </div>
        </div>

        <div className="flex flex-col lg:py-4">
          <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
            {displayName}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
            {product.description}
          </p>

          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Size
              </p>
              <p className="mt-2 text-sm text-[var(--foreground)]">
                {product.sizes.join(" · ")}
              </p>
            </div>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <p className="text-2xl font-semibold">{formatNaira(product.price)}</p>
            {product.compareAtPrice && (
              <p className="text-lg text-[var(--muted)] line-through">
                {formatNaira(product.compareAtPrice)}
              </p>
            )}
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              In stock
            </p>
            {product.inStock && product.pieces > 0 ? (
              <p className="mt-2 text-sm font-semibold text-[var(--accent)]">
                {product.pieces} {product.pieces === 1 ? "pc" : "pcs"} available
              </p>
            ) : (
              <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                Out of stock
              </p>
            )}
          </div>

          <ul className="mt-8 space-y-2 border-t border-[rgba(var(--accent-rgb),0.12)] pt-8 text-sm text-[var(--muted)]">
            {product.details.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="text-[var(--accent-muted)]">—</span>
                {d}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <AddToCartButton product={product} fullWidth size="large" />
            <MorphButton
              href={buildWhatsAppUrl(buildProductInquiryMessage(displayName))}
              className="sm:flex-1"
            >
              Questions? WhatsApp
            </MorphButton>
          </div>

          {!product.inStock && (
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              This item is currently unavailable. Message us on WhatsApp to ask
              about restocking.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
