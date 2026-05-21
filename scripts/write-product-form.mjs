import { writeFileSync } from "fs";

const d = "div";
const form = `"use client";

import Image from "next/image";
import { useActionState, useRef, useState, useTransition } from "react";
import type { ActionState } from "@/lib/admin/actions";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
} from "@/lib/admin/actions";
import type { Product } from "@/lib/products";
import { MorphButton } from "@/components/morph-button";

type ProductFormProps = {
  product?: Product;
};

const initial: ActionState = {};

export function ProductForm({ product }: ProductFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images ?? []);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const action = product
    ? updateProduct.bind(null, product.id)
    : createProduct;

  const [state, formAction, pending] = useActionState(action, initial);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploadError(null);
    const formData = new FormData();
    formData.set("file", file);

    startUpload(async () => {
      const result = await uploadProductImage(formData);
      if (result.error) {
        setUploadError(result.error);
        return;
      }
      if (result.url) {
        setImageUrls((prev) => [...prev, result.url!]);
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  function removeImage(url: string) {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  }

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <p className="rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <${d} className="grid gap-6 sm:grid-cols-2">
        <Field label="Product name *" name="name" defaultValue={product?.name} />
        <Field label="URL slug" name="slug" placeholder="auto from name" defaultValue={product?.slug} />
        <Field label="Category *" name="category" defaultValue={product?.category} />
        <Field label="Price (NGN) *" name="price" type="number" defaultValue={product?.price} />
        <Field label="Compare-at price" name="compareAtPrice" type="number" defaultValue={product?.compareAtPrice} />
        <Field label="Short description *" name="shortDescription" defaultValue={product?.shortDescription} className="sm:col-span-2" />
      </${d}>

      <label className="block text-sm font-medium">
        Description *
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={product?.description}
          className="morph-input mt-2 w-full rounded-2xl px-4 py-3 text-sm"
        />
      </label>

      <label className="block text-sm font-medium">
        Details (one per line)
        <textarea
          name="details"
          rows={4}
          defaultValue={product?.details.join("\\n")}
          className="morph-input mt-2 w-full rounded-2xl px-4 py-3 text-sm"
          placeholder="2 handkerchiefs per set"
        />
      </label>

      <${d}>
        <p className="text-sm font-medium">Images *</p>
        <p className="mt-1 text-xs text-[var(--muted)]">Upload photos or paste image URLs (one per line).</p>
        <textarea
          name="images"
          required
          rows={3}
          value={imageUrls.join("\\n")}
          onChange={(e) =>
            setImageUrls(
              e.target.value
                .split("\\n")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          className="morph-input mt-3 w-full rounded-2xl px-4 py-3 text-sm"
        />
        <${d} className="mt-4 flex flex-wrap items-end gap-3">
          <input ref={fileRef} type="file" accept="image/*" className="text-sm" />
          <MorphButton type="button" onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading…" : "Upload image"}
          </MorphButton>
        </${d}>
        {uploadError && <p className="mt-2 text-sm text-red-700">{uploadError}</p>}
        {imageUrls.length > 0 && (
          <${d} className="mt-4 flex flex-wrap gap-3">
            {imageUrls.map((url) => (
              <${d} key={url} className="relative h-24 w-20 overflow-hidden rounded-xl">
                <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-[10px] text-white"
                >
                  ×
                </button>
              </${d}>
            ))}
          </${d}>
        )}
      </${d}>

      <${d} className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="inStock" defaultChecked={product?.inStock ?? true} className="rounded" />
          In stock
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={product?.featured} className="rounded" />
          Featured on homepage
        </label>
      </${d}>

      <${d} className="flex flex-wrap gap-3 border-t border-[rgba(var(--accent-rgb),0.12)] pt-8">
        <MorphButton type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : product ? "Update product" : "Add product"}
        </MorphButton>
        <MorphButton type="button" onClick={() => history.back()}>
          Cancel
        </MorphButton>
      </${d}>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={\`block text-sm font-medium \${className}\`}>
      {label}
      <input
        name={name}
        type={type}
        required={name !== "slug" && name !== "compareAtPrice"}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="morph-input mt-2 w-full rounded-2xl px-4 py-2.5 text-sm"
      />
    </label>
  );
}
`;

writeFileSync("components/admin/product-form.tsx", form);
