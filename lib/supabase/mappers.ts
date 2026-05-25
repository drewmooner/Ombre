import type { Catalog } from "@/lib/catalog-types";
import type { Order, OrderDelivery, OrderLineItem } from "@/lib/order-types";
import type { Product } from "@/lib/product-types";
import type { ShopSettings } from "@/lib/shop-settings";
import type { ShopCustomer } from "@/lib/shop-types";

export type CatalogRow = {
  id: string;
  slug: string;
  name: string;
  image: string;
  default_price: number;
  default_product_name: string;
  sort_order: number;
};

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  price: number;
  catalog_id: string;
  pieces: number;
  sizes: string[];
  in_stock: boolean;
  featured: boolean;
  images: string[];
  details: string[];
};

export type ShopSettingsRow = {
  id: string;
  default_price: number;
  default_name: string;
  shop_open: boolean;
  shipping_fee_ngn: number;
  payment_timeout_minutes: number;
};

export type ShopCustomerRow = {
  id: string;
  email: string;
  created_at: string;
};

export type OrderRow = {
  id: string;
  customer_id: string;
  customer_email: string;
  status: Order["status"];
  delivery: OrderDelivery;
  items: OrderLineItem[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  paystack_reference: string | null;
  awaiting_payment_email_sent_at: string | null;
  receipt_email_sent_at: string | null;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  expires_at: string;
};

export type OtpRow = {
  email: string;
  code_hash: string;
  expires_at: string;
  last_sent_at: string;
  attempts: number;
};

export function catalogFromRow(row: CatalogRow): Catalog {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    image: row.image,
    defaultPrice: row.default_price,
    defaultProductName: row.default_product_name,
    sortOrder: row.sort_order ?? 0,
  };
}

export function catalogToRow(catalog: Catalog): CatalogRow {
  return {
    id: catalog.id,
    slug: catalog.slug,
    name: catalog.name,
    image: catalog.image,
    default_price: catalog.defaultPrice,
    default_product_name: catalog.defaultProductName,
    sort_order: catalog.sortOrder,
  };
}

export function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    price: row.price,
    catalogId: row.catalog_id,
    pieces: row.pieces,
    sizes: row.sizes?.length ? row.sizes : undefined,
    inStock: row.in_stock,
    featured: row.featured,
    images: row.images ?? [],
    details: row.details ?? [],
  };
}

export function productToRow(product: Product): ProductRow {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    short_description: product.shortDescription ?? "",
    description: product.description,
    price: product.price,
    catalog_id: product.catalogId,
    pieces: product.pieces,
    sizes: product.sizes ?? [],
    in_stock: product.inStock,
    featured: product.featured ?? false,
    images: product.images,
    details: product.details ?? [],
  };
}

export function settingsFromRow(row: ShopSettingsRow): ShopSettings {
  return {
    defaultPrice: row.default_price,
    defaultName: row.default_name,
    shopOpen: row.shop_open,
    shippingFeeNgn: row.shipping_fee_ngn,
    paymentTimeoutMinutes: row.payment_timeout_minutes,
  };
}

export function settingsToRow(settings: ShopSettings): ShopSettingsRow {
  return {
    id: "default",
    default_price: settings.defaultPrice,
    default_name: settings.defaultName,
    shop_open: settings.shopOpen,
    shipping_fee_ngn: settings.shippingFeeNgn,
    payment_timeout_minutes: settings.paymentTimeoutMinutes,
  };
}

export function customerFromRow(row: ShopCustomerRow): ShopCustomer {
  return {
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
  };
}

export function orderFromRow(row: OrderRow): Order {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerEmail: row.customer_email,
    status: row.status,
    delivery: row.delivery,
    items: row.items,
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    total: row.total,
    paystackReference: row.paystack_reference ?? undefined,
    awaitingPaymentEmailSentAt: row.awaiting_payment_email_sent_at ?? undefined,
    receiptEmailSentAt: row.receipt_email_sent_at ?? undefined,
    createdAt: row.created_at,
    paidAt: row.paid_at ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    expiresAt: row.expires_at,
  };
}

export function orderToRow(order: Order): OrderRow {
  return {
    id: order.id,
    customer_id: order.customerId,
    customer_email: order.customerEmail,
    status: order.status,
    delivery: order.delivery,
    items: order.items,
    subtotal: order.subtotal,
    shipping_fee: order.shippingFee,
    total: order.total,
    paystack_reference: order.paystackReference ?? null,
    awaiting_payment_email_sent_at: order.awaitingPaymentEmailSentAt ?? null,
    receipt_email_sent_at: order.receiptEmailSentAt ?? null,
    created_at: order.createdAt,
    paid_at: order.paidAt ?? null,
    delivered_at: order.deliveredAt ?? null,
    expires_at: order.expiresAt,
  };
}
