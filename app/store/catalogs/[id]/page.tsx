import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogProducts } from "@/components/store/catalog-products";
import { requireStore } from "@/lib/store-auth";
import { getCatalogWithProducts } from "@/lib/catalogs.server";
import { formatNaira } from "@/lib/format-price";
import { PencilIcon } from "@/components/icons";

type CatalogPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; productUpdated?: string }>;
};

export default async function CatalogDetailPage({
  params,
  searchParams,
}: CatalogPageProps) {
  await requireStore();
  const { id } = await params;
  const { updated, productUpdated } = await searchParams;
  const data = await getCatalogWithProducts(id);
  if (!data) notFound();

  const { products, ...catalog } = data;

  return (
    <article className="store-page">
      <Link href="/store/catalogs" className="store-back">← Catalogs</Link>

      {updated === "1" && (
        <p className="store-alert store-alert-success mb-6">Catalog updated</p>
      )}
      {productUpdated === "1" && (
        <p className="store-alert store-alert-success mb-6">Product updated</p>
      )}

      <header className="store-catalog-hero">
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl sm:aspect-[3/1]">
          <Image
            src={catalog.image}
            alt={catalog.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 960px"
            priority
          />
        </div>
        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="store-title">{catalog.name}</h1>
            <p className="store-lead mt-2">
              Default price {formatNaira(catalog.defaultPrice)} · /{catalog.slug}
            </p>
          </div>
          <Link
            href={`/store/catalogs/${catalog.id}/edit`}
            className="store-page-edit-btn"
            aria-label={`Edit ${catalog.name}`}
          >
            <PencilIcon className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <CatalogProducts catalog={catalog} products={products} />
    </article>
  );
}
