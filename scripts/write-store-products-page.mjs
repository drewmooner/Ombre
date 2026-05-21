import { writeFileSync } from "fs";
const d = "motionBar".replace("motionBar", "div");

writeFileSync(
  "app/store/products/page.tsx",
  `import Image from "next/image";
import Link from "next/link";
import { CatalogPanel } from "@/components/store/catalog-panel";
import { deleteProduct, toggleProductStock } from "@/lib/store/actions";
import { requireStore } from "@/lib/store-auth";
import { listCatalogs } from "@/lib/catalog-store";
import { formatNaira } from "@/lib/format-price";
import { getProducts } from "@/lib/products.server";
import { MorphButton } from "@/components/morph-button";

export default async function StoreProductsPage() {
  await requireStore();
  const products = await getProducts();
  const catalogs = await listCatalogs(products.map((p) => p.catalog));

  const byCatalog = catalogs.map((catalog) => ({
    catalog,
    items: products.filter((p) => p.catalog === catalog),
  }));

  return (
    <${d}>
      <${d} className="mb-8">
        <h1 className="font-display text-3xl font-medium">Your shop</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Manage catalogs and listings. Homepage shows product name and price only.
        </p>
      </${d}>

      <CatalogPanel catalogs={catalogs} />

      {products.length === 0 ? (
        <${d} className="morph-surface rounded-2xl p-10 text-center text-[var(--muted)]">
          No listings yet. Add a catalog above, then add your first product.
        </${d}>
      ) : (
        <${d} className="space-y-8">
          {byCatalog.map(({ catalog, items }) => (
            <section key={catalog}>
              <${d} className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-medium">{catalog}</h2>
                <MorphButton href={\`/store/products/new?catalog=\${encodeURIComponent(catalog)}\`}>
                  Add to {catalog}
                </MorphButton>
              </${d}>
              <ul className="space-y-3">
                {items.map((product) => (
                  <li key={product.id} className="morph-surface flex flex-wrap items-center gap-4 rounded-2xl p-4">
                    <${d} className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl">
                      <Image src={product.images[0]} alt="" fill className="object-cover" sizes="56px" />
                    </${d}>
                    <${d} className="min-w-0 flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {formatNaira(product.price)}
                        {!product.inStock && " · Out of stock"}
                      </p>
                    </${d}>
                    <${d} className="flex flex-wrap gap-2">
                      <MorphButton href={\`/store/products/\${product.id}/edit\`}>Edit</MorphButton>
                      <form action={toggleProductStock.bind(null, product.id)}>
                        <MorphButton type="submit">{product.inStock ? "Out of stock" : "In stock"}</MorphButton>
                      </form>
                      <form action={deleteProduct.bind(null, product.id)}>
                        <MorphButton type="submit" className="text-red-800">Delete</MorphButton>
                      </form>
                    </${d}>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </${d}>
      )}
    </${d}>
  );
}
`,
);
