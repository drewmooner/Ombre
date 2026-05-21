import type { Order } from "@/lib/order-types";

/** Needs attention in admin: awaiting payment or paid but not delivered yet. */
export function isActiveOrder(order: Order): boolean {
  return order.status === "pending" || order.status === "paid";
}

export function countActiveOrders(orders: Order[]): number {
  return orders.filter(isActiveOrder).length;
}
