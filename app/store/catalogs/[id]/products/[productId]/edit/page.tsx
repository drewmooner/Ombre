import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/store/product-form";
import { requireStore } from "@/lib/store-auth";
import { getCatalogById } from "@/lib/catalogs.server";
import { getProductById } from "@/lib/products.server";

type EditProductPageProps = {
  params: Promise<{ id: string; productId: string }>;
};

export default async function EditCatalogProductPage({ params }: EditProductPageProps) {
  await requireStore();
  const { id, productId } = await params;
  const [catalog, product] = await Promise.all([
    getCatalogById(id),
    getProductById(productId),
  ]);
  if (!catalog || !product || product.catalogId !== catalog.id) notFound();

  return (
    <article className="store-page store-page-narrow">
      <Link href={`/store/catalogs/${id}`} className="store-back">← {catalog.name}</Link>
      <header className="mb-8">
        <p className="store-eyebrow">Edit product</p>
        <h1 className="store-title">{product.name}</h1>
      </header>
      <ProductForm catalog={catalog} product={product} />
    </article>
  );
}
