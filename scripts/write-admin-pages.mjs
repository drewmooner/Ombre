import { writeFileSync } from "fs";
const tag = "di" + "v";

writeFileSync(
  "app/admin/products/page.tsx",
  `import Image from "next/image";
import Link from "next/link";
import { deleteProduct, toggleProductStock } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { formatNaira } from "@/lib/format-price";
import { getProducts } from "@/lib/products";
import { MorphButton } from "@/components/morph-button";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await getProducts();

  return (
    <${tag}>
      <${tag} className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <${tag}>
          <h1 className="font-display text-3xl font-medium">Products</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {products.length} {products.length === 1 ? "item" : "items"} in your shop
          </p>
        </${tag}>
        <MorphButton href="/admin/products/new" variant="primary">
          Add product
        </MorphButton>
      </${tag}>

      {products.length === 0 ? (
        <${tag} className="morph-surface rounded-2xl p-10 text-center text-[var(--muted)]">
          No products yet. Add your first item to open the shop.
        </${tag}>
      ) : (
        <ul className="space-y-3">
          {products.map((product) => (
            <li
              key={product.id}
              className="morph-surface flex flex-wrap items-center gap-4 rounded-2xl p-4 sm:gap-6"
            >
              <${tag} className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={product.images[0]}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </${tag}>
              <${tag} className="min-w-0 flex-1">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {formatNaira(product.price)} · {product.category}
                  {!product.inStock && " · Out of stock"}
                </p>
              </${tag}>
              <${tag} className="flex flex-wrap gap-2">
                <MorphButton href={\`/admin/products/\${product.id}/edit\`}>
                  Edit
                </MorphButton>
                <form action={toggleProductStock.bind(null, product.id)}>
                  <MorphButton type="submit">
                    {product.inStock ? "Mark out of stock" : "Mark in stock"}
                  </MorphButton>
                </form>
                <form action={deleteProduct.bind(null, product.id)}>
                  <MorphButton type="submit" className="text-red-800">
                    Delete
                  </MorphButton>
                </form>
              </${tag}>
            </li>
          ))}
        </ul>
      )}
    </${tag}>
  );
}
`,
);

writeFileSync(
  "app/admin/products/new/page.tsx",
  `import { requireAdmin } from "@/lib/admin-auth";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <${tag}>
      <h1 className="mb-8 font-display text-3xl font-medium">Add product</h1>
      <ProductForm />
    </${tag}>
  );
}
`,
);

writeFileSync(
  "app/admin/products/[id]/edit/page.tsx",
  `import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin-auth";
import { getProductById } from "@/lib/products";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditPageProps) {
  await requireAdmin();
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <${tag}>
      <h1 className="mb-8 font-display text-3xl font-medium">Edit product</h1>
      <ProductForm product={product} />
    </${tag}>
  );
}
`,
);
