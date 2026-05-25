import type { DeliveryMethod } from "./delivery-methods";
import { formatPaymentDeadline } from "./format-date";

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
  /** Sum of product line items before any later delivery-fee confirmation. */
  subtotal: number;
  /** Delivery fee charged at checkout. New orders keep this at 0 and confirm later. */
  shippingFee: number;
  total: number;
  delivery: OrderDelivery;
  status: OrderStatus;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  deliveredAt?: string;
  paystackReference?: string;
  /** Set after the awaiting-payment email is sent successfully */
  awaitingPaymentEmailSentAt?: string;
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
      return `Complete payment before ${formatPaymentDeadline(order.expiresAt)} or stock is released.`;
    case "paid":
      return "Payment received — we’ll confirm your delivery fee on WhatsApp before dispatch.";
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
