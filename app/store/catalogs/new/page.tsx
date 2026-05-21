import Link from "next/link";
import { CatalogForm } from "@/components/store/catalog-form";
import { requireStore } from "@/lib/store-auth";

export default async function NewCatalogPage() {
  await requireStore();

  return (
    <article className="store-page store-page-narrow">
      <Link href="/store/catalogs" className="store-back">← Catalogs</Link>
      <header className="mb-8">
        <p className="store-eyebrow">New</p>
        <h1 className="store-title">Create catalog</h1>
        <p className="store-lead">Name, cover image, and default price for new products.</p>
      </header>
      <CatalogForm />
    </article>
  );
}
