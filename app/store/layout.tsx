export const dynamic = "force-dynamic";

import { StoreProviders } from "@/components/store/store-providers";
import { StoreNav } from "@/components/store/store-nav";
import { countActiveOrders } from "@/lib/order-active";
import { listOrders } from "@/lib/order-store";
import { isStoreAuthenticated } from "@/lib/store-auth";
import { getShopSettings } from "@/lib/shop-settings";
import { prepareDb } from "@/lib/db-backend";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await prepareDb();
  const authed = await isStoreAuthenticated();
  const [shopOpen, activeOrderCount] = authed
    ? await Promise.all([
        getShopSettings().then((s) => s.shopOpen),
        listOrders().then(countActiveOrders),
      ])
    : [true, 0];

  return (
    <StoreProviders>
      <div className="page-ambient store-shell min-h-full">
        {authed && (
          <StoreNav shopOpen={shopOpen} activeOrderCount={activeOrderCount} />
        )}
        <main className="store-main mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
      </div>
    </StoreProviders>
  );
}
