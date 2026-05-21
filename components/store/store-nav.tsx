import Link from "next/link";
import { LogoutButton } from "./logout-button";
import { ShopOpenToggle } from "./shop-open-toggle";

type StoreNavProps = {
  shopOpen: boolean;
  activeOrderCount?: number;
};

export function StoreNav({ shopOpen, activeOrderCount = 0 }: StoreNavProps) {
  const hasActiveOrders = activeOrderCount > 0;
  return (
    <header className="store-header">
      <div className="store-header-inner store-header-inner--responsive">
        <Link href="/store/catalogs" className="store-header-brand min-w-0">
          <span className="morph-btn brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-lg font-semibold">
            O
          </span>
          <span className="store-header-brand-name">Ombré</span>
          <span className="store-header-label">Store</span>
        </Link>

        <nav className="store-header-nav flex items-center gap-1 text-sm" aria-label="Store">
          <Link href="/store/catalogs" className="store-header-nav-link">
            Catalogs
          </Link>
          <Link
            href="/store/orders"
            className={`store-header-nav-link${hasActiveOrders ? " store-header-nav-link--active-orders" : ""}`}
          >
            Orders
            {hasActiveOrders ? (
              <span className="store-header-nav-badge" aria-label={`${activeOrderCount} active orders`}>
                {activeOrderCount}
              </span>
            ) : null}
          </Link>
          <Link href="/" className="store-header-nav-link">
            View shop
          </Link>
        </nav>

        <div className="store-header-actions">
          <ShopOpenToggle shopOpen={shopOpen} />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
