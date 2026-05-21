"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import { useActionState } from "react";
import {
  confirmOrderPaymentAction,
  markOrderDeliveredAction,
  type OrderActionState,
} from "@/lib/store/order-actions";
import { deliveryMethodLabel } from "@/lib/delivery-methods";
import { isActiveOrder } from "@/lib/order-active";
import { orderStatusLabel, type Order } from "@/lib/order-types";
import { formatNaira } from "@/lib/format-price";
import { formatOrderDate } from "@/lib/format-date";

type OrdersAdminListProps = {
  orders: Order[];
};

const initial: OrderActionState = {};

function StatusBadge({ status }: { status: Order["status"] }) {
  const className =
    status === "delivered"
      ? "store-order-badge store-order-badge--delivered"
      : status === "paid"
        ? "store-order-badge store-order-badge--paid"
        : status === "expired"
          ? "store-order-badge store-order-badge--expired"
          : "store-order-badge store-order-badge--pending";
  return <span className={className}>{orderStatusLabel(status)}</span>;
}

function OrderDetailPanel({ order }: { order: Order }) {
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmOrderPaymentAction,
    initial,
  );
  const [deliveredState, deliveredAction, deliveredPending] = useActionState(
    markOrderDeliveredAction,
    initial,
  );
  const d = order.delivery;

  return (
    <div className="store-orders-detail-panel">
      <div className="store-orders-detail-grid">
        <section>
          <h4 className="store-orders-detail-heading">Delivery</h4>
          <p className="mt-2 inline-flex rounded-full bg-[rgba(var(--accent-rgb),0.08)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">
            {deliveryMethodLabel(d.method)}
          </p>
          <p className="mt-3 text-sm font-medium">{d.fullName}</p>
          <p className="text-sm text-[var(--muted)]">
            {d.email || order.customerEmail}
          </p>
          <p className="text-sm text-[var(--muted)]">{d.phone}</p>
          <p className="mt-1 text-sm leading-relaxed">
            {d.addressLine}
            <br />
            {d.city}, {d.state}
          </p>
        </section>
        <section>
          <h4 className="store-orders-detail-heading">Timeline</h4>
          <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
            <li>Placed {formatOrderDate(order.createdAt)}</li>
            {order.status === "pending" ? (
              <li className="text-amber-800">
                Pay by {formatOrderDate(order.expiresAt)}
              </li>
            ) : null}
            {order.paidAt ? <li>Paid {formatOrderDate(order.paidAt)}</li> : null}
            {order.deliveredAt ? (
              <li className="text-emerald-800">
                Delivered {formatOrderDate(order.deliveredAt)}
              </li>
            ) : null}
            {order.paystackReference ? (
              <li className="font-mono text-xs">Ref {order.paystackReference}</li>
            ) : null}
          </ul>
        </section>
      </div>

      <div className="mt-5">
        <h4 className="store-orders-detail-heading">Line items</h4>
        <ul className="mt-3 space-y-2">
          {order.items.map((item) => (
            <li
              key={`${order.id}-${item.productId}`}
              className="flex gap-3 rounded-lg bg-[rgba(var(--accent-rgb),0.04)] p-2.5"
            >
              <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium leading-snug">{item.name}</p>
                {item.size ? (
                  <p className="text-[var(--muted)]">Size: {item.size}</p>
                ) : null}
                <p className="text-[var(--muted)]">
                  Qty {item.quantity} · {formatNaira(item.price)} each
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {formatNaira(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {order.status === "pending" && order.paystackReference ? (
          <form action={confirmAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <button
              type="submit"
              disabled={confirmPending}
              className="store-order-action-btn store-order-action-btn--primary"
            >
              {confirmPending ? "…" : "Confirm payment"}
            </button>
          </form>
        ) : null}
        {order.status === "paid" ? (
          <form action={deliveredAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <button
              type="submit"
              disabled={deliveredPending}
              className="store-order-action-btn store-order-action-btn--primary"
            >
              {deliveredPending ? "…" : "Mark delivered"}
            </button>
          </form>
        ) : null}
        {order.status === "delivered" ? (
          <p className="text-xs text-emerald-800">
            Visible in customer order history
          </p>
        ) : null}
        {order.status === "pending" ? (
          <p className="text-xs text-[var(--muted)]">
            Stock reserved until payment completes or expires.
          </p>
        ) : null}
        {order.status === "expired" ? (
          <p className="text-xs text-[var(--muted)]">Stock returned to shop.</p>
        ) : null}
      </div>

      {confirmState.success ? (
        <p className="mt-2 text-xs text-emerald-800">{confirmState.success}</p>
      ) : null}
      {confirmState.error ? (
        <p className="mt-2 text-xs text-red-700">{confirmState.error}</p>
      ) : null}
      {deliveredState.success ? (
        <p className="mt-2 text-xs text-emerald-800">{deliveredState.success}</p>
      ) : null}
      {deliveredState.error ? (
        <p className="mt-2 text-xs text-red-700">{deliveredState.error}</p>
      ) : null}
    </div>
  );
}

function OrderMobileCard({
  order,
  expanded,
  onToggle,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
}) {
  const active = isActiveOrder(order);
  const itemQty = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <article
      className={`store-orders-mobile-card${active ? " store-orders-mobile-card--active" : ""}`}
    >
      <div className="store-orders-mobile-card-head">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--muted)]">{formatOrderDate(order.createdAt)}</p>
          <p
            className={`mt-1 truncate text-sm font-semibold${active ? " text-[var(--accent)]" : ""}`}
            title={order.customerEmail}
          >
            {order.customerEmail}
          </p>
          <p className="truncate text-xs text-[var(--muted)]">{order.delivery.fullName}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-lg font-medium text-[var(--accent)] tabular-nums">
            {formatNaira(order.total)}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {itemQty} {itemQty === 1 ? "item" : "items"}
          </p>
        </div>
      </div>
      <div className="store-orders-mobile-card-meta">
        <StatusBadge status={order.status} />
        {active ? <span className="store-order-active-pill">Active</span> : null}
        <span className="store-orders-delivery-tag">
          {deliveryMethodLabel(order.delivery.method)}
        </span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="store-order-action-btn w-full"
        aria-expanded={expanded}
      >
        {expanded ? "Hide details" : "View details"}
      </button>
      {expanded ? (
        <div className="store-orders-mobile-card-detail">
          <OrderDetailPanel order={order} />
        </div>
      ) : null}
    </article>
  );
}

export function OrdersAdminList({ orders }: OrdersAdminListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <section className="store-card store-empty">
        <p className="font-display text-xl font-medium">No orders yet</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Orders appear here when a customer checks out. Mark paid orders as
          delivered when shipped.
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="store-orders-mobile md:hidden">
        {orders.map((order) => (
          <OrderMobileCard
            key={order.id}
            order={order}
            expanded={expandedId === order.id}
            onToggle={() =>
              setExpandedId(expandedId === order.id ? null : order.id)
            }
          />
        ))}
        <p className="store-orders-table-footer px-1">
          {orders.length} {orders.length === 1 ? "order" : "orders"} · newest first
        </p>
      </div>

      <div className="store-card store-orders-table-wrap hidden md:block">
      <div className="overflow-x-auto">
        <table className="store-orders-table">
          <thead>
            <tr>
              <th scope="col">Placed</th>
              <th scope="col">Customer</th>
              <th scope="col">Delivery</th>
              <th scope="col" className="text-right">
                Items
              </th>
              <th scope="col" className="text-right">
                Total
              </th>
              <th scope="col">Status</th>
              <th scope="col" className="text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const active = isActiveOrder(order);
              const expanded = expandedId === order.id;
              const itemQty = order.items.reduce((s, i) => s + i.quantity, 0);

              return (
                <Fragment key={order.id}>
                  <tr
                    className={`store-orders-table-row${active ? " store-orders-table-row--active" : ""}${expanded ? " store-orders-table-row--expanded" : ""}`}
                  >
                    <td className="whitespace-nowrap text-sm text-[var(--muted)]">
                      {formatOrderDate(order.createdAt)}
                    </td>
                    <td>
                      <p
                        className={`max-w-[12rem] truncate text-sm font-medium sm:max-w-[16rem]${active ? " store-order-email--active" : ""}`}
                        title={order.customerEmail}
                      >
                        {order.customerEmail}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {order.delivery.fullName}
                      </p>
                    </td>
                    <td className="text-sm">
                      <span className="store-orders-delivery-tag">
                        {deliveryMethodLabel(order.delivery.method)}
                      </span>
                      <p className="mt-0.5 max-w-[10rem] truncate text-xs text-[var(--muted)] sm:max-w-[14rem]">
                        {order.delivery.city}, {order.delivery.state}
                      </p>
                    </td>
                    <td className="text-right text-sm tabular-nums text-[var(--muted)]">
                      {itemQty}
                    </td>
                    <td className="text-right text-sm font-semibold tabular-nums text-[var(--accent)]">
                      {formatNaira(order.total)}
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                      {active ? (
                        <span className="store-order-active-pill ml-1.5">
                          Active
                        </span>
                      ) : null}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : order.id)
                        }
                        className="store-order-action-btn"
                        aria-expanded={expanded}
                      >
                        {expanded ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="store-orders-detail-row">
                      <td colSpan={7}>
                        <OrderDetailPanel order={order} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="store-orders-table-footer">
        {orders.length} {orders.length === 1 ? "order" : "orders"} · newest first
      </p>
    </div>
    </>
  );
}
