import { OrdersAdminList } from "@/components/store/orders-admin-list";
import { runOrderMaintenance } from "@/lib/order-maintenance";
import { requireStore } from "@/lib/store-auth";
import { listOrders } from "@/lib/order-store";

export default async function StoreOrdersPage() {
  await requireStore();
  await runOrderMaintenance();
  const orders = await listOrders();

  return (
    <article className="store-page">
      <header className="store-page-header">
        <div>
          <p className="store-eyebrow">Store dashboard</p>
          <h1 className="store-title">Orders</h1>
          <p className="store-lead">
            Mark orders as delivered after payment and shipping. Only{" "}
            <strong>paid</strong> and <strong>delivered</strong> orders show in
            customer order history.
          </p>
        </div>
      </header>
      <OrdersAdminList orders={orders} />
    </article>
  );
}
