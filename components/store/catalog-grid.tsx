"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import type { Catalog } from "@/lib/catalog-types";
import { deleteCatalogAction, type ActionState } from "@/lib/store/actions";
import { formatNaira } from "@/lib/format-price";
import { PencilIcon } from "@/components/icons";
import { isRedirectErrorMessage } from "./use-action-redirect";
import { useActionSuccess } from "./use-action-success";

type CatalogGridProps = {
  catalogs: Array<Catalog & { productCount: number }>;
};

const initial: ActionState = {};

function CatalogCard({
  catalog,
}: {
  catalog: Catalog & { productCount: number };
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [state, action, pending] = useActionState(
    deleteCatalogAction.bind(null, catalog.id),
    initial,
  );

  useActionSuccess(state.success, pending, () => {
    setConfirmDelete(false);
    router.refresh();
  });

  return (
    <article className="store-catalog-card group relative">
      <Link href={`/store/catalogs/${catalog.id}`} className="block">
        <span className="relative block aspect-[4/3] overflow-hidden rounded-t-2xl bg-[var(--background-deep)]">
          <Image
            src={catalog.image}
            alt={catalog.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, 280px"
          />
        </span>
        <span className="block px-4 pb-4 pt-3">
          <span className="font-display text-lg font-medium leading-tight">
            {catalog.name}
          </span>
          <span className="mt-1 block text-sm text-[var(--muted)]">
            {catalog.productCount} product{catalog.productCount === 1 ? "" : "s"}
            {" · "}
            from {formatNaira(catalog.defaultPrice)}
          </span>
        </span>
      </Link>

      {!confirmDelete && (
        <Link
          href={`/store/catalogs/${catalog.id}/edit`}
          className="store-catalog-icon-btn absolute left-3 top-3"
          aria-label={`Edit ${catalog.name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <PencilIcon />
        </Link>
      )}

      <span className="absolute right-3 top-3 flex gap-2">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setConfirmDelete(true);
            }}
            className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-black/65"
          >
            Delete
          </button>
        ) : (
          <span className="flex flex-col items-end gap-1">
            {catalog.productCount > 0 ? (
              <span className="max-w-[11rem] rounded-lg bg-black/55 px-2 py-1 text-[10px] leading-snug text-white backdrop-blur-sm">
                Deletes {catalog.productCount} product
                {catalog.productCount === 1 ? "" : "s"} too
              </span>
            ) : null}
            <span className="flex gap-1">
            <form action={action}>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-medium text-[var(--on-accent)]"
              >
                {pending ? "…" : "Confirm"}
              </button>
            </form>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setConfirmDelete(false);
              }}
              className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm"
            >
              Cancel
            </button>
            </span>
          </span>
        )}
      </span>

      {state.success && (
        <p className="px-4 pb-1 text-xs text-emerald-800">{state.success}</p>
      )}
      {state.error && !isRedirectErrorMessage(state.error) && (
        <p className="px-4 pb-3 text-xs text-red-700">{state.error}</p>
      )}
    </article>
  );
}

export function CatalogGrid({ catalogs }: CatalogGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {catalogs.map((catalog) => (
        <li key={catalog.id}>
          <CatalogCard catalog={catalog} />
        </li>
      ))}
    </ul>
  );
}
