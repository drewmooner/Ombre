import { randomUUID } from "crypto";
import {
  isOrderVisibleInCustomerHistory,
  type Order,
  type OrderDelivery,
  type OrderLineItem,
} from "./order-types";
import { restoreProductPieces } from "./product-store";
import { prepareDb, usesSupabase } from "./db-backend";
import * as json from "./json-data";
import { getSupabaseAdmin } from "./supabase/admin";
import { orderFromRow, orderToRow } from "./supabase/mappers";

export async function markReceiptEmailSent(orderId: string): Promise<void> {
  if (!usesSupabase()) {
    await json.jsonMarkReceiptEmailSent(orderId);
    return;
  }
  await prepareDb();
  const { error } = await getSupabaseAdmin()
    .from("orders")
    .update({ receipt_email_sent_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
}

export async function listOrders(): Promise<Order[]> {
  if (!usesSupabase()) return json.jsonListOrders();
  await prepareDb();
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => orderFromRow(row));
}

export async function listCustomerOrderHistory(
  customerId: string,
): Promise<Order[]> {
  if (!usesSupabase()) return json.jsonListCustomerOrderHistory(customerId);
  const orders = await listOrders();
  return orders
    .filter(
      (o) => o.customerId === customerId && isOrderVisibleInCustomerHistory(o),
    )
    .sort(
      (a, b) =>
        new Date(b.deliveredAt ?? b.paidAt ?? b.createdAt).getTime() -
        new Date(a.deliveredAt ?? a.paidAt ?? a.createdAt).getTime(),
    );
}

export async function findOrderById(id: string): Promise<Order | null> {
  if (!usesSupabase()) return json.jsonFindOrderById(id);
  await prepareDb();
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? orderFromRow(data) : null;
}

export async function findOrderByPaystackReference(
  reference: string,
): Promise<Order | null> {
  if (!usesSupabase()) return json.jsonFindOrderByPaystackReference(reference);
  await prepareDb();
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .eq("paystack_reference", reference)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? orderFromRow(data) : null;
}

export type CreatePendingOrderInput = {
  customerId: string;
  customerEmail: string;
  items: OrderLineItem[];
  subtotal: number;
  shippingFee: number;
  delivery: OrderDelivery;
  paymentTimeoutMinutes: number;
  paystackReference: string;
};

export async function createPendingOrder(
  input: CreatePendingOrderInput,
): Promise<Order> {
  const now = Date.now();
  const createdAt = new Date(now).toISOString();
  const expiresAt = new Date(
    now + input.paymentTimeoutMinutes * 60_000,
  ).toISOString();

  const order: Order = {
    id: randomUUID(),
    customerId: input.customerId,
    customerEmail: input.customerEmail.trim().toLowerCase(),
    items: input.items.map((i) => ({ ...i })),
    subtotal: Math.round(input.subtotal),
    shippingFee: 0,
    total: Math.round(input.subtotal),
    delivery: input.delivery,
    status: "pending",
    createdAt,
    expiresAt,
    paystackReference: input.paystackReference,
  };

  if (!usesSupabase()) return json.jsonCreateOrder(order);
  await prepareDb();
  const { error } = await getSupabaseAdmin()
    .from("orders")
    .insert(orderToRow(order));
  if (error) throw new Error(error.message);
  return order;
}

export async function releaseOrderStock(order: Order): Promise<void> {
  for (const item of order.items) {
    await restoreProductPieces(item.productId, item.quantity);
  }
}

export async function expirePendingOrder(order: Order): Promise<Order> {
  if (order.status !== "pending") return order;

  await releaseOrderStock(order);
  const updated: Order = { ...order, status: "expired" };

  if (!usesSupabase()) return json.jsonUpdateOrder(updated);
  await prepareDb();
  const { error } = await getSupabaseAdmin()
    .from("orders")
    .update({ status: "expired" })
    .eq("id", order.id);
  if (error) throw new Error(error.message);
  return updated;
}

export async function expireDuePendingOrders(): Promise<number> {
  const now = Date.now();
  const orders = await listOrders();
  let count = 0;
  for (const order of orders) {
    if (order.status !== "pending") continue;
    if (new Date(order.expiresAt).getTime() > now) continue;
    await expirePendingOrder(order);
    count += 1;
  }
  return count;
}

export async function confirmOrderPayment(
  orderId: string,
  paystackReference: string,
): Promise<{ order: Order; alreadyPaid: boolean }> {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("Order not found");

  if (order.status === "paid" || order.status === "delivered") {
    return { order, alreadyPaid: true };
  }
  if (order.status === "expired") {
    throw new Error("This order has expired — stock was released");
  }
  if (order.status !== "pending") {
    throw new Error("Order cannot be paid");
  }

  const updated: Order = {
    ...order,
    status: "paid",
    paidAt: new Date().toISOString(),
    paystackReference,
  };

  if (!usesSupabase()) {
    await json.jsonUpdateOrder(updated);
    return { order: updated, alreadyPaid: false };
  }

  await prepareDb();
  const { error } = await getSupabaseAdmin()
    .from("orders")
    .update({
      status: "paid",
      paid_at: updated.paidAt,
      paystack_reference: paystackReference,
    })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
  return { order: updated, alreadyPaid: false };
}

export async function markOrderDelivered(id: string): Promise<Order> {
  const order = await findOrderById(id);
  if (!order) throw new Error("Order not found");
  if (order.status !== "paid" || !order.paidAt) {
    throw new Error("Order must be paid before it can be marked delivered");
  }

  const updated: Order = {
    ...order,
    status: "delivered",
    deliveredAt: new Date().toISOString(),
  };

  if (!usesSupabase()) return json.jsonUpdateOrder(updated);
  await prepareDb();
  const { error } = await getSupabaseAdmin()
    .from("orders")
    .update({
      status: "delivered",
      delivered_at: updated.deliveredAt,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return updated;
}
