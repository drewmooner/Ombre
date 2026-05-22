import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerOrdersList } from "@/components/shop/customer-orders-list";
import { MorphButton } from "@/components/morph-button";
import { listCustomerOrders } from "@/lib/order-store";
import { getShopCustomer } from "@/lib/shop-auth";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const customer = await getShopCustomer();
  if (!customer) {
    redirect("/login?next=/orders");
  }

  const orders = await listCustomerOrders(customer.id);
  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "paid",
  );
  const deliveredOrders = orders.filter((o) => o.status === "delivered");

  return (
    <div className="shop-orders-page">
      <div className="shop-orders-page__inner">
        <header className="shop-orders-page__header">
          <Link href="/" className="shop-orders-page__back link-accent">
            ← Continue shopping
          </Link>
          <h1 className="shop-orders-page__title">Orders</h1>
          <p className="shop-orders-page__subtitle">
            Track payments, processing, and deliveries for everything you&apos;ve
            checked out.
          </p>
        </header>

        {orders.length === 0 ? (
          <section className="shop-orders-empty morph-surface">
            <p className="shop-orders-empty__title">No orders yet</p>
            <p className="shop-orders-empty__text">
              When you place an order, it will show up here with its status —
              from payment through to delivery.
            </p>
            <MorphButton href="/" variant="primary" className="mt-8">
              Browse the shop
            </MorphButton>
          </section>
        ) : (
          <CustomerOrdersList
            activeOrders={activeOrders}
            deliveredOrders={deliveredOrders}
          />
        )}
      </div>
    </div>
  );
}
