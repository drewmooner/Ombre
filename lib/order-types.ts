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
