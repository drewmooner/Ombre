import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogForm } from "@/components/store/catalog-form";
import { requireStore } from "@/lib/store-auth";
import { getCatalogById } from "@/lib/catalogs.server";

type EditCatalogPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCatalogPage({ params }: EditCatalogPageProps) {
  await requireStore();
  const { id } = await params;
  const catalog = await getCatalogById(id);
  if (!catalog) notFound();

  return (
    <article className="store-page store-page-narrow">
      <Link href={`/store/catalogs/${catalog.id}`} className="store-back">
        ← {catalog.name}
      </Link>
      <header className="mb-8">
        <p className="store-eyebrow">Edit catalog</p>
        <h1 className="store-title">{catalog.name}</h1>
        <p className="store-lead">Update name, cover image, slug, or default price.</p>
      </header>
      <CatalogForm catalog={catalog} />
    </article>
  );
}
