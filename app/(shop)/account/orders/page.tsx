import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MorphButton } from "@/components/morph-button";
import { formatNaira } from "@/lib/format-price";
import { formatOrderDate } from "@/lib/format-date";
import { listCustomerOrderHistory } from "@/lib/order-store";
import { getShopCustomer } from "@/lib/shop-auth";

export const dynamic = "force-dynamic";

export default async function OrderHistoryPage() {
  const customer = await getShopCustomer();
  if (!customer) {
    redirect("/login");
  }

  const orders = await listCustomerOrderHistory(customer.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-10">
      <Link
        href="/"
        className="link-accent mb-8 inline-block text-sm text-[var(--muted)] transition-colors"
      >
        ← Back to shop
      </Link>

      <header className="mb-10">
        <h1 className="font-display text-3xl font-medium sm:text-4xl">
          Order history
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Completed orders that were paid and delivered to you.
        </p>
      </header>

      {orders.length === 0 ? (
        <section className="morph-surface rounded-2xl px-6 py-12 text-center">
          <p className="font-display text-xl font-medium">No orders yet</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            When you checkout and your order is delivered, it will appear here.
          </p>
          <MorphButton href="/" variant="primary" className="mt-8">
            Continue shopping
          </MorphButton>
        </section>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => (
            <li key={order.id} className="morph-surface rounded-2xl p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[rgba(var(--accent-rgb),0.1)] pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Delivered
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {order.deliveredAt
                      ? formatOrderDate(order.deliveredAt)
                      : formatOrderDate(order.paidAt!)}
                  </p>
                </div>
                <p className="text-lg font-semibold">{formatNaira(order.subtotal)}</p>
              </div>

              <ul className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <li
                    key={`${order.id}-${item.productId}`}
                    className="flex gap-3"
                  >
                    <Link
                      href={`/product/${item.slug}`}
                      className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${item.slug}`}
                        className="font-medium leading-snug hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Qty {item.quantity} · {formatNaira(item.price)} each
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">
                      {formatNaira(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
