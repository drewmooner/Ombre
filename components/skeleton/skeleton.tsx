type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`.trim()} aria-hidden />;
}

function LoadingLabel() {
  return <span className="sr-only">Loading…</span>;
}

export function ShopHomeSkeleton() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-10"
      role="status"
      aria-busy="true"
    >
      <LoadingLabel />
      <Skeleton className="mb-8 h-10 w-48 max-w-full rounded-full sm:mb-10" />
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="flex flex-col">
            <Skeleton className="mb-4 aspect-[3/4] w-full rounded-2xl" />
            <Skeleton className="h-5 w-[75%] max-w-48" />
            <Skeleton className="mt-2 h-4 w-16" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10"
      role="status"
      aria-busy="true"
    >
      <LoadingLabel />
      <Skeleton className="mb-8 h-4 w-28" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
        <div className="flex flex-col gap-4 lg:py-4">
          <Skeleton className="h-12 w-[80%] max-w-md" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-4 h-8 w-32" />
          <div className="mt-6 space-y-2 border-t border-[rgba(var(--accent-rgb),0.1)] pt-8">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-12 flex-1 rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div
      className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-10"
      role="status"
      aria-busy="true"
    >
      <LoadingLabel />
      <div className="mb-10 flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      <ul className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="flex gap-4 rounded-2xl border border-[rgba(var(--accent-rgb),0.08)] p-4 sm:gap-5 sm:p-5"
          >
            <Skeleton className="h-24 w-20 shrink-0 rounded-xl sm:h-28 sm:w-24" />
            <div className="flex flex-1 flex-col justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-[75%]" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
      <Skeleton className="mt-8 h-44 w-full rounded-2xl" />
    </div>
  );
}

export function StoreCatalogsSkeleton() {
  return (
    <article className="store-page" role="status" aria-busy="true">
      <LoadingLabel />
      <header className="store-page-header">
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-11 w-36 shrink-0 rounded-full" />
      </header>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="store-card overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 px-4 pb-4 pt-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function StoreCatalogDetailSkeleton() {
  return (
    <article className="store-page" role="status" aria-busy="true">
      <LoadingLabel />
      <Skeleton className="mb-6 h-4 w-24" />
      <Skeleton className="aspect-[21/9] w-full rounded-2xl sm:aspect-[3/1]" />
      <div className="mt-6 space-y-2">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <section className="store-card mt-10 overflow-hidden">
        <div className="store-card-header flex justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <div className="divide-y divide-[rgba(var(--accent-rgb),0.06)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-4 sm:px-5">
              <Skeleton className="h-14 w-11 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24 sm:hidden" />
              </div>
              <Skeleton className="hidden h-4 w-16 sm:block" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

export function StoreFormSkeleton() {
  return (
    <article className="store-page store-page-narrow" role="status" aria-busy="true">
      <LoadingLabel />
      <Skeleton className="mb-6 h-4 w-24" />
      <div className="mb-8 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      <div className="store-form space-y-8">
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
        <div className="space-y-5">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </article>
  );
}

export function StoreLoginSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-4"
      role="status"
      aria-busy="true"
    >
      <LoadingLabel />
      <Skeleton className="h-64 w-full rounded-3xl" />
      <Skeleton className="mt-8 h-4 w-28" />
    </div>
  );
}
