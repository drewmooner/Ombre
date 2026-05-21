import { writeFileSync } from "fs";

const d = "div";

writeFileSync(
  "components/store/product-form.tsx",
  `"use client";

import Image from "next/image";
import { useActionState, useRef, useState, useTransition } from "react";
import type { ActionState } from "@/lib/store/actions";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
} from "@/lib/store/actions";
import { DEFAULT_CATALOG, defaultsForCatalog } from "@/lib/product-defaults";
import type { Product } from "@/lib/product-types";
import { MorphButton } from "@/components/morph-button";

type ProductFormProps = {
  product?: Product;
  catalogs: string[];
  defaultCatalog?: string;
};

const initial: ActionState = {};

export function ProductForm({
  product,
  catalogs,
  defaultCatalog = DEFAULT_CATALOG,
}: ProductFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images ?? []);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState(product?.catalog ?? defaultCatalog);
  const [showNewCatalog, setShowNewCatalog] = useState(false);

  const catalogDefaults = defaultsForCatalog(catalog);

  const action = product
    ? updateProduct.bind(null, product.id)
    : createProduct;

  const [state, formAction, pending] = useActionState(action, initial);

  async function uploadFile(file: File) {
    setUploadError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadProductImage(formData);
    if (result.error) {
      setUploadError(result.error);
      return;
    }
    if (result.url) setImageUrls((prev) => [...prev, result.url!]);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    startUpload(async () => {
      for (const file of Array.from(files)) await uploadFile(file);
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <form action={formAction} className="mx-auto max-w-lg space-y-8">
      {state.error && (
        <p className="rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <section className="space-y-3">
        <${d}>
          <h2 className="text-sm font-semibold">Product photos</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Tap to add photos. First image is the shop cover.</p>
        </${d}>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="morph-surface flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-[rgba(var(--accent-rgb),0.22)] py-12">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.1)] text-2xl text-[var(--accent)]">+</span>
          <span className="text-sm font-medium">{uploading ? "Uploading…" : "Tap to add photos"}</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleFileChange} />
        <input type="hidden" name="images" value={imageUrls.join("\\n")} />
        {uploadError && <p className="text-sm text-red-700">{uploadError}</p>}
        {imageUrls.length > 0 && (
          <ul className="grid grid-cols-3 gap-3">
            {imageUrls.map((url, i) => (
              <li key={url} className="relative aspect-[3/4] overflow-hidden rounded-xl">
                <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] text-[var(--on-accent)]">Cover</span>}
                <button type="button" onClick={() => setImageUrls((p) => p.filter((u) => u !== url))} className="absolute right-2 top-2 h-6 w-6 rounded-full bg-black/65 text-xs text-white">×</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-5 border-t border-[rgba(var(--accent-rgb),0.1)] pt-8">
        <${d}>
          <label className="block text-sm font-medium">Catalog</label>
          {!showNewCatalog ? (
            <>
              <select name="catalog" value={catalog} onChange={(e) => setCatalog(e.target.value)}
                className="morph-input mt-2 w-full rounded-2xl px-4 py-2.5 text-sm">
                {catalogs.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="button" onClick={() => setShowNewCatalog(true)} className="link-accent mt-2 text-xs">+ Add new catalog</button>
            </>
          ) : (
            <>
              <input name="catalogNew" type="text" placeholder="e.g. Scarves" className="morph-input mt-2 w-full rounded-2xl px-4 py-2.5 text-sm" />
              <button type="button" onClick={() => setShowNewCatalog(false)} className="link-accent mt-2 text-xs">Use existing catalog</button>
            </>
          )}
        </${d}>

        <label className="block text-sm font-medium">Name (shown on shop)
          <input name="name" required defaultValue={product?.name ?? catalogDefaults.name} placeholder="Handkerchief 2pcs" className="morph-input mt-2 w-full rounded-2xl px-4 py-2.5 text-sm" />
        </label>

        <label className="block text-sm font-medium">Price (₦)
          <input name="price" type="number" required defaultValue={product?.price ?? 4500} className="morph-input mt-2 w-full rounded-2xl px-4 py-2.5 text-sm" />
        </label>

        <label className="block text-sm font-medium">Description (product page only)
          <textarea name="description" required rows={4} defaultValue={product?.description ?? catalogDefaults.description} className="morph-input mt-2 w-full rounded-2xl px-4 py-3 text-sm" />
          <span className="mt-1 block text-xs text-[var(--muted)]">Not shown on the homepage — only name and price appear there.</span>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-[rgba(var(--accent-rgb),0.1)] bg-white/30 px-4 py-3">
          <input type="checkbox" name="inStock" defaultChecked={product?.inStock ?? true} className="h-4 w-4 accent-[var(--accent)]" />
          <span className="text-sm font-medium">In stock</span>
        </label>
      </section>

      <MorphButton type="submit" variant="primary" fullWidth disabled={pending || uploading}>
        {pending ? "Saving…" : product ? "Save changes" : "Publish to shop"}
      </MorphButton>
    </form>
  );
}
`,
);
