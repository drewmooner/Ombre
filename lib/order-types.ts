import type { DeliveryMethod } from "./delivery-methods";

export type OrderStatus = "pending" | "paid" | "delivered" | "expired";

export type OrderDelivery = {
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  method: DeliveryMethod;
};

export type OrderLineItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
};

export type Order = {
  id: string;
  customerId: string;
  customerEmail: string;
  items: OrderLineItem[];
  /** Sum of product line items — order total matches this (no shipping added) */
  subtotal: number;
  /** Legacy field; always 0 for new orders */
  shippingFee: number;
  total: number;
  delivery: OrderDelivery;
  status: OrderStatus;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  deliveredAt?: string;
  paystackReference?: string;
  /** Set after payment confirmation email is sent successfully */
  receiptEmailSentAt?: string;
};

/** Shown on customer order history — paid checkout and delivered only */
export function isOrderVisibleInCustomerHistory(order: Order): boolean {
  return order.status === "delivered" && Boolean(order.paidAt) && Boolean(order.deliveredAt);
}

/** Shown on the shop Orders page only after payment has completed. */
export function isCustomerOrdersPageOrder(order: Order): boolean {
  if (!order.paidAt) return false;
  return order.status === "paid" || order.status === "delivered";
}

export function customerOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "Awaiting payment";
    case "paid":
      return "Processing";
    case "delivered":
      return "Delivered";
    case "expired":
      return "Payment expired";
  }
}

export function customerOrderStatusHint(order: Order): string {
  switch (order.status) {
    case "pending":
      return `Complete payment before ${new Date(order.expiresAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })} or stock is released.`;
    case "paid":
      return "Payment received — we're preparing your order for delivery.";
    case "delivered":
      return order.deliveredAt
        ? `Delivered ${new Date(order.deliveredAt).toLocaleString("en-NG", { dateStyle: "medium" })}.`
        : "Your order has been delivered.";
    case "expired":
      return "This order expired before payment was completed.";
  }
}

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "Awaiting payment";
    case "paid":
      return "Paid";
    case "delivered":
      return "Delivered";
    case "expired":
      return "Payment expired";
  }
}
