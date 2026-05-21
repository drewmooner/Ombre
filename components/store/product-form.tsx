"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { Product } from "@/lib/product-types";
import type { Catalog } from "@/lib/catalog-types";
import type { ActionState } from "@/lib/store/actions";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
} from "@/lib/store/actions";
import { getDefaultProductFields } from "@/lib/catalog-product-defaults";
import { MorphButton } from "@/components/morph-button";
import { ActionAlerts } from "./action-alerts";
import { useActionRedirect } from "./use-action-redirect";
import { useActionSuccess } from "./use-action-success";

type ProductFormProps = {
  catalog: Catalog;
  product?: Product;
  /** Slugs already used in this catalog — used to pick the next -1, -2, … */
  existingSlugs?: string[];
};

const initial: ActionState = {};

export function ProductForm({
  catalog,
  product,
  existingSlugs = [],
}: ProductFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const slugAtSubmitRef = useRef("");
  const catalogDefaults = useMemo(
    () => getDefaultProductFields(catalog, existingSlugs),
    [catalog, existingSlugs],
  );
  const [uploading, startUpload] = useTransition();
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images ?? []);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [name, setName] = useState(product?.name ?? catalogDefaults.name);
  const [slug, setSlug] = useState(product?.slug ?? catalogDefaults.slug);
  const [formKey, setFormKey] = useState(0);

  slugAtSubmitRef.current = slug;

  const action = product
    ? updateProduct.bind(null, catalog.id, product.id)
    : createProduct.bind(null, catalog.id);

  const [state, formAction, pending] = useActionState(action, initial);

  useActionSuccess(state.success, pending, () => {
    router.refresh();
    if (!product) {
      const defaults = getDefaultProductFields(catalog, [
        ...existingSlugs,
        slugAtSubmitRef.current,
      ]);
      setImageUrls([]);
      setName(defaults.name);
      setSlug(defaults.slug);
      setFormKey((k) => k + 1);
    }
  });

  useActionRedirect(state, pending);

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

  return (
    <form
      key={formKey}
      action={formAction}
      className="store-form space-y-6"
    >
      <input type="hidden" name="catalogId" value={catalog.id} />

      <ActionAlerts state={state} />

      <section className="space-y-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="store-upload-zone"
        >
          <span className="store-upload-icon">+</span>
          <span className="text-sm font-medium">
            {uploading ? "Uploading…" : "Add photos"}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            const files = e.target.files;
            if (!files?.length) return;
            startUpload(async () => {
              for (const file of Array.from(files)) await uploadFile(file);
              if (fileRef.current) fileRef.current.value = "";
            });
          }}
        />
        <input type="hidden" name="images" value={imageUrls.join("\n")} />
        {uploadError && <p className="text-sm text-red-700">{uploadError}</p>}
        {imageUrls.length > 0 && (
          <ul className="grid grid-cols-4 gap-2">
            {imageUrls.map((url, i) => (
              <li key={url} className="relative aspect-[3/4] overflow-hidden rounded-lg">
                <Image src={url} alt="" fill className="object-cover" sizes="72px" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[9px] text-[var(--on-accent)]">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setImageUrls((p) => p.filter((u) => u !== url))}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-[10px] text-white"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="store-form-fields">
        <label className="store-label">
          Name
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={catalogDefaults.name}
            className="store-input mt-2"
          />
        </label>

        <label className="store-label">
          URL slug
          <span className="store-hint">Numbered per catalog (e.g. …-2)</span>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="store-input mt-2 font-mono text-[13px]"
          />
        </label>

        <label className="store-label">
          Price (₦)
          <input
            name="price"
            type="number"
            required
            min={0}
            defaultValue={product?.price ?? catalog.defaultPrice}
            key={`price-${formKey}`}
            className="store-input mt-2"
          />
        </label>

        <label className="store-label">
          Size
          <span className="store-hint">Comma-separated, e.g. S, M, L or One size</span>
          <input
            name="sizes"
            defaultValue={product?.sizes?.join(", ") ?? ""}
            key={`sizes-${formKey}`}
            placeholder="S, M, L"
            className="store-input mt-2"
          />
        </label>

        <label className="store-label">
          Pieces in stock
          <span className="store-hint">At 0 pcs the product is marked out of stock</span>
          <input
            name="pieces"
            type="number"
            required
            min={0}
            step={1}
            defaultValue={product?.pieces ?? 1}
            key={`pieces-${formKey}`}
            className="store-input mt-2"
          />
        </label>
      </section>

      <MorphButton type="submit" variant="primary" fullWidth disabled={pending || uploading}>
        {pending ? "Saving…" : product ? "Save changes" : "Add product"}
      </MorphButton>
    </form>
  );
}
