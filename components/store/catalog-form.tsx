"use client";

import { ProductImage } from "@/components/shop/product-image";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { ActionAlerts } from "./action-alerts";
import { useActionRedirect } from "./use-action-redirect";
import { useActionSuccess } from "./use-action-success";
import type { Catalog } from "@/lib/catalog-types";
import type { ActionState } from "@/lib/store/actions";
import {
  createCatalog,
  updateCatalog,
  uploadProductImage,
} from "@/lib/store/actions";
import { slugify } from "@/lib/slug";
import { MorphButton } from "@/components/morph-button";

type CatalogFormProps = {
  catalog?: Catalog;
};

const initial: ActionState = {};

export function CatalogForm({ catalog }: CatalogFormProps) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [name, setName] = useState(catalog?.name ?? "");
  const [slug, setSlug] = useState(catalog?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(catalog));
  const [imageUrl, setImageUrl] = useState(catalog?.image ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const action = catalog
    ? updateCatalog.bind(null, catalog.id)
    : createCatalog;

  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  useActionRedirect(state, pending, () => {
    if (state.success) toast.success(state.success);
  });

  useActionSuccess(state.error, pending, () => {
    if (state.error) toast.error(state.error);
  });

  async function handleUpload(file: File) {
    setUploadError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadProductImage(formData);
    if (result.error) {
      setUploadError(result.error);
      return;
    }
    if (result.url) setImageUrl(result.url);
  }

  return (
    <form action={formAction} className="store-form mx-auto max-w-md space-y-8">
      <ActionAlerts state={state} />

      <section className="space-y-3">
        <label className="store-label">
          Cover image
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="store-upload-zone mt-2"
          >
            {imageUrl ? (
              <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl">
                <ProductImage src={imageUrl} alt="" fill className="object-cover" sizes="400px" />
              </span>
            ) : (
              <>
                <span className="store-upload-icon">+</span>
                <span className="text-sm font-medium">
                  {uploading ? "Uploading…" : "Add catalog image"}
                </span>
              </>
            )}
          </button>
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            startUpload(() => handleUpload(file));
            e.target.value = "";
          }}
        />
        <input type="hidden" name="image" value={imageUrl} />
        {uploadError && <p className="text-sm text-red-700">{uploadError}</p>}
      </section>

      <section className="store-form-fields">
        <label className="store-label">
          Catalog name
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Handkerchiefs"
            className="store-input mt-2"
          />
        </label>

        <label className="store-label">
          URL slug
          <span className="store-hint">Auto-filled from name — edit if needed</span>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="handkerchiefs"
            className="store-input mt-2 font-mono text-[13px]"
          />
        </label>

        <label className="store-label">
          Default price (₦)
          <input
            name="defaultPrice"
            type="number"
            required
            min={0}
            defaultValue={catalog?.defaultPrice ?? 12000}
            className="store-input mt-2"
          />
        </label>
      </section>

      <MorphButton type="submit" variant="primary" fullWidth disabled={pending || uploading}>
        {pending ? "Saving…" : catalog ? "Save catalog" : "Create catalog"}
      </MorphButton>
    </form>
  );
}
