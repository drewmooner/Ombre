/**
 * Local JSON file storage — used when Supabase env vars are not set (e.g. CI build).
 */
import { createHash, randomInt } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { Catalog } from "./catalog-types";
import type { Order, OrderDelivery, OrderLineItem, OrderStatus } from "./order-types";
import { parseDeliveryMethod } from "./delivery-methods";
import {
  isCustomerOrdersPageOrder,
  isOrderVisibleInCustomerHistory,
} from "./order-types";
import type { Product } from "./product-types";
import type { ShopSettings } from "./shop-settings";
import type { ShopCustomer } from "./shop-types";
import { OTP_MIN_RESEND_SECONDS } from "./otp-constants";

const DATA_DIR = path.join(process.cwd(), "data");

// --- Catalogs ---

const SEED_CATALOGS: Catalog[] = [
  {
    id: "handkerchiefs",
    slug: "handkerchiefs",
    name: "Handkerchiefs",
    image:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&h=600&fit=crop&q=80",
    defaultPrice: 12000,
    defaultProductName: "Handkerchief 2pcs",
  },
];

async function readCatalogs(): Promise<Catalog[]> {
  try {
    const raw = await readFile(path.join(DATA_DIR, "catalogs.json"), "utf-8");
    const parsed = JSON.parse(raw) as Catalog[];
    return parsed.length ? parsed : SEED_CATALOGS;
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(
      path.join(DATA_DIR, "catalogs.json"),
      JSON.stringify(SEED_CATALOGS, null, 2),
      "utf-8",
    );
    return SEED_CATALOGS;
  }
}

async function writeCatalogs(catalogs: Catalog[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    path.join(DATA_DIR, "catalogs.json"),
    JSON.stringify(catalogs, null, 2),
    "utf-8",
  );
}

export async function jsonListCatalogs(): Promise<Catalog[]> {
  const catalogs = await readCatalogs();
  return [...catalogs].sort((a, b) => a.name.localeCompare(b.name));
}

export async function jsonFindCatalogById(id: string): Promise<Catalog | null> {
  const catalogs = await readCatalogs();
  return catalogs.find((c) => c.id === id) ?? null;
}

export async function jsonFindCatalogBySlug(slug: string): Promise<Catalog | null> {
  const catalogs = await readCatalogs();
  return catalogs.find((c) => c.slug === slug) ?? null;
}

export async function jsonCreateCatalog(catalog: Catalog): Promise<Catalog> {
  const catalogs = await readCatalogs();
  catalogs.push(catalog);
  await writeCatalogs(catalogs);
  return catalog;
}

export async function jsonUpdateCatalog(catalog: Catalog): Promise<Catalog> {
  const catalogs = await readCatalogs();
  const index = catalogs.findIndex((c) => c.id === catalog.id);
  if (index === -1) throw new Error("Catalog not found");
  catalogs[index] = catalog;
  await writeCatalogs(catalogs);
  return catalog;
}

export async function jsonDeleteCatalog(id: string): Promise<Catalog> {
  const catalogs = await readCatalogs();
  const index = catalogs.findIndex((c) => c.id === id);
  if (index === -1) throw new Error("Catalog not found");
  const [removed] = catalogs.splice(index, 1);
  await writeCatalogs(catalogs);
  return removed;
}

// --- Products ---

async function readProducts(): Promise<Product[]> {
  try {
    const raw = await readFile(path.join(DATA_DIR, "products.json"), "utf-8");
    return JSON.parse(raw) as Product[];
  } catch {
    return [];
  }
}

async function writeProducts(products: Product[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    path.join(DATA_DIR, "products.json"),
    JSON.stringify(products, null, 2),
    "utf-8",
  );
}

export async function jsonListProducts(): Promise<Product[]> {
  const products = await readProducts();
  return products.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function sortCatalogProducts(a: Product, b: Product): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  return a.name.localeCompare(b.name);
}

export async function jsonListProductsByCatalogId(catalogId: string): Promise<Product[]> {
  const products = await readProducts();
  return products.filter((p) => p.catalogId === catalogId).sort(sortCatalogProducts);
}

export async function jsonListProductsByCatalogPage(
  catalogId: string,
  offset: number,
  limit: number,
): Promise<{ products: Product[]; total: number }> {
  const all = await jsonListProductsByCatalogId(catalogId);
  const total = all.length;
  const products = all.slice(offset, offset + limit);
  return { products, total };
}

export async function jsonCountProductsByCatalogId(catalogId: string): Promise<number> {
  const products = await readProducts();
  return products.filter((p) => p.catalogId === catalogId).length;
}

export async function jsonFindProductBySlug(slug: string): Promise<Product | null> {
  const products = await readProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function jsonFindProductById(id: string): Promise<Product | null> {
  const products = await readProducts();
  return products.find((p) => p.id === id) ?? null;
}

export async function jsonCreateProduct(product: Product): Promise<Product> {
  const products = await readProducts();
  products.push(product);
  await writeProducts(products);
  return product;
}

export async function jsonUpdateProduct(product: Product): Promise<Product> {
  const products = await readProducts();
  const index = products.findIndex((p) => p.id === product.id);
  if (index === -1) throw new Error("Product not found");
  products[index] = product;
  await writeProducts(products);
  return product;
}

export async function jsonDeleteProduct(id: string): Promise<Product> {
  const products = await readProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Product not found");
  const [removed] = products.splice(index, 1);
  await writeProducts(products);
  return removed;
}

export async function jsonUpdateProductStock(product: Product): Promise<Product> {
  const products = await readProducts();
  const index = products.findIndex((p) => p.id === product.id);
  if (index === -1) throw new Error("Product not found");
  products[index] = product;
  await writeProducts(products);
  return product;
}

// --- Shop settings ---

const BUILTIN_SETTINGS: ShopSettings = {
  defaultPrice: 12000,
  defaultName: "Handkerchief 2pcs",
  shopOpen: true,
  shippingFeeNgn: 2500,
  paymentTimeoutMinutes: 45,
};

export async function jsonGetShopSettings(): Promise<ShopSettings> {
  try {
    const raw = await readFile(path.join(DATA_DIR, "shop-settings.json"), "utf-8");
    const parsed = JSON.parse(raw) as Partial<ShopSettings>;
    return { ...BUILTIN_SETTINGS, ...parsed };
  } catch {
    return BUILTIN_SETTINGS;
  }
}

export async function jsonWriteShopSettings(settings: ShopSettings): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    path.join(DATA_DIR, "shop-settings.json"),
    JSON.stringify(settings, null, 2),
    "utf-8",
  );
}

// --- Shop users ---

export async function jsonFindOrCreateShopUser(email: string): Promise<ShopCustomer> {
  const normalized = email.trim().toLowerCase();
  let users: ShopCustomer[] = [];
  try {
    const raw = await readFile(path.join(DATA_DIR, "shop-users.json"), "utf-8");
    users = JSON.parse(raw) as ShopCustomer[];
  } catch {
    users = [];
  }
  const existing = users.find((u) => u.email === normalized);
  if (existing) return existing;
  const user: ShopCustomer = {
    id: randomUUID(),
    email: normalized,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    path.join(DATA_DIR, "shop-users.json"),
    JSON.stringify(users, null, 2),
    "utf-8",
  );
  return user;
}

export async function jsonFindShopUserById(id: string): Promise<ShopCustomer | null> {
  try {
    const raw = await readFile(path.join(DATA_DIR, "shop-users.json"), "utf-8");
    const users = JSON.parse(raw) as ShopCustomer[];
    return users.find((u) => u.id === id) ?? null;
  } catch {
    return null;
  }
}

// --- Orders ---

function emptyDelivery(): OrderDelivery {
  return {
    fullName: "",
    email: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    method: "doorstep",
  };
}

function normalizeLineItem(raw: unknown): OrderLineItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as OrderLineItem;
  if (
    typeof row.productId !== "string" ||
    typeof row.name !== "string" ||
    typeof row.price !== "number" ||
    typeof row.quantity !== "number"
  ) {
    return null;
  }
  return row;
}

function normalizeOrder(raw: unknown): Order | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (
    typeof row.id !== "string" ||
    typeof row.customerId !== "string" ||
    !Array.isArray(row.items)
  ) {
    return null;
  }
  const items = row.items
    .map(normalizeLineItem)
    .filter((i): i is OrderLineItem => i !== null);
  if (items.length === 0) return null;

  const subtotal =
    typeof row.subtotal === "number"
      ? row.subtotal
      : items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = typeof row.shippingFee === "number" ? row.shippingFee : 0;
  const total = typeof row.total === "number" ? row.total : subtotal;
  const statusRaw = row.status;
  const status: OrderStatus =
    statusRaw === "paid" ||
    statusRaw === "delivered" ||
    statusRaw === "expired" ||
    statusRaw === "pending"
      ? statusRaw
      : "pending";

  const d = row.delivery;
  const method =
    d && typeof d === "object"
      ? parseDeliveryMethod(String((d as OrderDelivery).method ?? "")) ?? "doorstep"
      : "doorstep";

  return {
    id: row.id as string,
    customerId: row.customerId as string,
    customerEmail: typeof row.customerEmail === "string" ? row.customerEmail : "",
    items,
    subtotal: Math.round(subtotal),
    shippingFee: Math.round(shippingFee),
    total: Math.round(total),
    delivery:
      d && typeof d === "object"
        ? { ...(d as OrderDelivery), method }
        : emptyDelivery(),
    status,
    createdAt:
      typeof row.createdAt === "string" ? row.createdAt : new Date().toISOString(),
    expiresAt:
      typeof row.expiresAt === "string"
        ? row.expiresAt
        : new Date(Date.now() + 45 * 60_000).toISOString(),
    paidAt: typeof row.paidAt === "string" ? row.paidAt : undefined,
    deliveredAt: typeof row.deliveredAt === "string" ? row.deliveredAt : undefined,
    paystackReference:
      typeof row.paystackReference === "string" ? row.paystackReference : undefined,
    receiptEmailSentAt:
      typeof row.receiptEmailSentAt === "string" ? row.receiptEmailSentAt : undefined,
  };
}

async function readOrders(): Promise<Order[]> {
  try {
    const raw = await readFile(path.join(DATA_DIR, "orders.json"), "utf-8");
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeOrder).filter((o): o is Order => o !== null);
  } catch {
    return [];
  }
}

async function writeOrders(orders: Order[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    path.join(DATA_DIR, "orders.json"),
    JSON.stringify(orders, null, 2),
    "utf-8",
  );
}

export async function jsonListOrders(): Promise<Order[]> {
  const orders = await readOrders();
  return orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function jsonFindOrderById(id: string): Promise<Order | null> {
  const orders = await readOrders();
  return orders.find((o) => o.id === id) ?? null;
}

export async function jsonFindOrderByPaystackReference(
  reference: string,
): Promise<Order | null> {
  const orders = await readOrders();
  return orders.find((o) => o.paystackReference === reference) ?? null;
}

export async function jsonCreateOrder(order: Order): Promise<Order> {
  const orders = await readOrders();
  orders.push(order);
  await writeOrders(orders);
  return order;
}

export async function jsonUpdateOrder(order: Order): Promise<Order> {
  const orders = await readOrders();
  const index = orders.findIndex((o) => o.id === order.id);
  if (index === -1) throw new Error("Order not found");
  orders[index] = order;
  await writeOrders(orders);
  return order;
}

export async function jsonListCustomerOrders(customerId: string): Promise<Order[]> {
  const orders = await readOrders();
  return orders
    .filter(
      (o) => o.customerId === customerId && isCustomerOrdersPageOrder(o),
    )
    .sort(
      (a, b) =>
        new Date(b.deliveredAt ?? b.paidAt ?? b.createdAt).getTime() -
        new Date(a.deliveredAt ?? a.paidAt ?? a.createdAt).getTime(),
    );
}

export async function jsonListCustomerOrderHistory(customerId: string): Promise<Order[]> {
  const orders = await readOrders();
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

export async function jsonMarkReceiptEmailSent(orderId: string): Promise<void> {
  const orders = await readOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) return;
  orders[index] = {
    ...orders[index],
    receiptEmailSentAt: new Date().toISOString(),
  };
  await writeOrders(orders);
}

// --- OTP ---

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const MIN_RESEND_MS = OTP_MIN_RESEND_SECONDS * 1000;

type OtpRecord = {
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
};

type OtpFile = Record<string, OtpRecord>;

function otpSecret(): string {
  return process.env.ADMIN_SECRET ?? "ombre-otp-dev-secret";
}

function hashCode(email: string, code: string): string {
  return createHash("sha256")
    .update(`${otpSecret()}:otp:${email}:${code}`)
    .digest("hex");
}

async function readOtp(): Promise<OtpFile> {
  try {
    const raw = await readFile(path.join(DATA_DIR, "otp-challenges.json"), "utf-8");
    const parsed = JSON.parse(raw) as OtpFile;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeOtp(data: OtpFile): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    path.join(DATA_DIR, "otp-challenges.json"),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}

function pruneOtp(data: OtpFile): OtpFile {
  const now = Date.now();
  const next: OtpFile = {};
  for (const [key, record] of Object.entries(data)) {
    if (record.expiresAt > now) next[key] = record;
  }
  return next;
}

export async function jsonCreateOtp(
  email: string,
  code: string,
): Promise<
  | { ok: true }
  | { ok: false; error: string; retryAfterSeconds?: number }
> {
  const data = pruneOtp(await readOtp());
  const existing = data[email];
  const now = Date.now();
  if (existing && now - existing.lastSentAt < MIN_RESEND_MS) {
    const retryAfterSeconds = Math.ceil(
      (MIN_RESEND_MS - (now - existing.lastSentAt)) / 1000,
    );
    return {
      ok: false,
      error: `Wait ${retryAfterSeconds}s before requesting another code`,
      retryAfterSeconds,
    };
  }
  data[email] = {
    email,
    codeHash: hashCode(email, code),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: now,
  };
  await writeOtp(data);
  return { ok: true };
}

export async function jsonVerifyOtp(
  email: string,
  code: string,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const data = pruneOtp(await readOtp());
  const record = data[email];
  if (!record) {
    return { ok: false, error: "Code expired or not found. Request a new one." };
  }
  if (Date.now() > record.expiresAt) {
    delete data[email];
    await writeOtp(data);
    return { ok: false, error: "Code expired. Request a new one." };
  }
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    delete data[email];
    await writeOtp(data);
    return { ok: false, error: "Too many attempts. Request a new code." };
  }
  if (record.codeHash !== hashCode(email, code)) {
    record.attempts += 1;
    data[email] = record;
    await writeOtp(data);
    return { ok: false, error: "Incorrect code. Try again." };
  }
  delete data[email];
  await writeOtp(data);
  return { ok: true, email };
}
