import Image from "next/image";
import Link from "next/link";
import { deliveryMethodLabel } from "@/lib/delivery-methods";
import { formatNaira } from "@/lib/format-price";
import { formatOrderDate } from "@/lib/format-date";
import {
  customerOrderStatusHint,
  customerOrderStatusLabel,
  type Order,
} from "@/lib/order-types";

function OrderStatusBadge({ status }: { status: Order["status"] }) {
  const className =
    status === "delivered"
      ? "shop-order-badge shop-order-badge--delivered"
      : status === "paid"
        ? "shop-order-badge shop-order-badge--paid"
        : "shop-order-badge shop-order-badge--pending";
  return (
    <span className={className}>{customerOrderStatusLabel(status)}</span>
  );
}

function OrderCard({ order }: { order: Order }) {
  const itemQty = order.items.reduce((s, i) => s + i.quantity, 0);
  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <article className="shop-order-card">
      <header className="shop-order-card__head">
        <div className="min-w-0">
          <p className="shop-order-card__eyebrow">Order · {shortId}</p>
          <p className="shop-order-card__date">
            Placed {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <div className="shop-order-card__head-end">
          <OrderStatusBadge status={order.status} />
          <p className="shop-order-card__total">{formatNaira(order.total)}</p>
          {order.shippingFee > 0 ? (
            <p className="text-xs text-[var(--muted)] tabular-nums">
              incl. {formatNaira(order.shippingFee)} delivery
            </p>
          ) : null}
        </div>
      </header>

      <p className="shop-order-card__hint">{customerOrderStatusHint(order)}</p>

      <ul className="shop-order-card__items">
        {order.items.map((item) => (
          <li key={`${order.id}-${item.productId}`} className="shop-order-item">
            <Link
              href={`/product/${item.slug}`}
              className="shop-order-item__thumb"
            >
              <Image
                src={item.image}
                alt=""
                fill
                sizes="72px"
                className="object-cover"
              />
            </Link>
            <div className="shop-order-item__body">
              <Link
                href={`/product/${item.slug}`}
                className="shop-order-item__name"
              >
                {item.name}
              </Link>
              <p className="shop-order-item__meta">
                {item.size ? (
                  <>
                    Size {item.size}
                    <span className="shop-order-item__dot" aria-hidden>
                      ·
                    </span>
                  </>
                ) : null}
                Qty {item.quantity}
              </p>
            </div>
            <p className="shop-order-item__price">
              {formatNaira(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <footer className="shop-order-card__foot">
        <div className="shop-order-card__delivery">
          <p className="shop-order-card__delivery-label">Delivery</p>
          <p className="shop-order-card__delivery-value">
            {deliveryMethodLabel(order.delivery.method)}
            <span className="shop-order-item__dot" aria-hidden>
              ·
            </span>
            {order.delivery.city}, {order.delivery.state}
          </p>
        </div>
        <p className="shop-order-card__summary">
          {itemQty} {itemQty === 1 ? "item" : "items"}
          {order.paidAt ? (
            <>
              <span className="shop-order-item__dot" aria-hidden>
                ·
              </span>
              Paid {formatOrderDate(order.paidAt)}
            </>
          ) : null}
        </p>
      </footer>
    </article>
  );
}

type CustomerOrdersListProps = {
  activeOrders: Order[];
  deliveredOrders: Order[];
};

export function CustomerOrdersList({
  activeOrders,
  deliveredOrders,
}: CustomerOrdersListProps) {
  return (
    <div className="shop-orders-sections">
      {activeOrders.length > 0 ? (
        <section className="shop-orders-section">
          <h2 className="shop-orders-section__title">Processing</h2>
          <p className="shop-orders-section__lead">
            Paid orders being prepared for delivery.
          </p>
          <ul className="shop-orders-list">
            {activeOrders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {deliveredOrders.length > 0 ? (
        <section className="shop-orders-section">
          <h2 className="shop-orders-section__title">Delivered</h2>
          <p className="shop-orders-section__lead">
            Completed orders that reached you.
          </p>
          <ul className="shop-orders-list">
            {deliveredOrders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
