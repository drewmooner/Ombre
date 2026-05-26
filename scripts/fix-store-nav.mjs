import { writeFileSync } from "fs";

const d = "d" + "iv";

writeFileSync(
  "components/store/store-nav.tsx",
  `import Link from "next/link";
import { logoutStore } from "@/lib/store/actions";

export function StoreNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(var(--accent-rgb),0.1)] bg-[rgba(243,238,236,0.85)] backdrop-blur-xl">
      <${d} className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <${d} className="flex items-center gap-3">
          <Link
            href="/store/products"
            className="font-display text-xl font-medium tracking-tight text-[var(--accent)]"
          >
            0mbré
          </Link>
          <span className="hidden text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] sm:inline">
            Store
          </span>
        </${d}>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/store/products"
            className="rounded-full px-3 py-1.5 font-medium text-[var(--foreground)] transition-colors hover:bg-white/40"
          >
            Inventory
          </Link>
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-[var(--muted)] transition-colors hover:bg-white/40 hover:text-[var(--accent)]"
          >
            View shop
          </Link>
        </nav>
        <form action={logoutStore}>
          <button
            type="submit"
            className="rounded-full border border-[rgba(var(--accent-rgb),0.12)] bg-white/30 px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:border-[rgba(var(--accent-rgb),0.2)] hover:text-[var(--accent)]"
          >
            Log out
          </button>
        </form>
      </${d}>
    </header>
  );
}
`,
);
