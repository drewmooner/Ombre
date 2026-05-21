import { readFile } from "fs/promises";
import path from "path";
import type { Catalog } from "@/lib/catalog-types";
import type { Order } from "@/lib/order-types";
import type { Product } from "@/lib/product-types";
import type { ShopSettings } from "@/lib/shop-settings";
import type { ShopCustomer } from "@/lib/shop-types";
import { getSupabaseAdmin } from "./admin";
import {
  catalogToRow,
  orderToRow,
  productToRow,
  settingsToRow,
  type ProductRow,
} from "./mappers";
import { isSupabaseConfigured } from "./config";
import { isSchemaApplied, runSchemaMigration } from "./migrate";

const DATA_DIR = path.join(process.cwd(), "data");

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

const BUILTIN_SETTINGS: ShopSettings = {
  defaultPrice: 12000,
  defaultName: "Handkerchief 2pcs",
  shopOpen: true,
  shippingFeeNgn: 0,
  paymentTimeoutMinutes: 45,
};

let ready: Promise<void> | null = null;

function isMissingTableError(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("does not exist") ||
    lower.includes("could not find the table") ||
    lower.includes("schema cache")
  );
}

async function tableExists(): Promise<boolean> {
  try {
    if (await isSchemaApplied()) return true;
  } catch {
    /* fall through to REST check */
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("catalogs").select("id").limit(1);
  if (!error) return true;
  if (isMissingTableError(error.message)) return false;
  throw new Error(`Supabase error: ${error.message}`);
}

async function readJsonFile<T>(filename: string): Promise<T | null> {
  try {
    const raw = await readFile(path.join(DATA_DIR, filename), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function seedIfEmpty(): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { count: catalogCount, error: catalogErr } = await supabase
    .from("catalogs")
    .select("id", { count: "exact", head: true });
  if (catalogErr) throw new Error(catalogErr.message);

  if ((catalogCount ?? 0) === 0) {
    const fromFile = await readJsonFile<Catalog[]>("catalogs.json");
    const catalogs = fromFile?.length ? fromFile : SEED_CATALOGS;
    const { error } = await supabase
      .from("catalogs")
      .upsert(catalogs.map(catalogToRow), { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  const { count: productCount, error: productErr } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true });
  if (productErr) throw new Error(productErr.message);

  if ((productCount ?? 0) === 0) {
    const fromFile = await readJsonFile<Product[]>("products.json");
    if (fromFile?.length) {
      const rows: ProductRow[] = fromFile.map((p) =>
        productToRow({
          ...p,
          shortDescription: p.shortDescription ?? "",
          featured: p.featured ?? false,
          details: p.details ?? [],
        }),
      );
      const { error } = await supabase
        .from("products")
        .upsert(rows, { onConflict: "id" });
      if (error) throw new Error(error.message);
    }
  }

  const { data: settingsRow, error: settingsErr } = await supabase
    .from("shop_settings")
    .select("id")
    .eq("id", "default")
    .maybeSingle();
  if (settingsErr) throw new Error(settingsErr.message);

  if (!settingsRow) {
    const fromFile = await readJsonFile<Partial<ShopSettings>>("shop-settings.json");
    const settings: ShopSettings = {
      defaultPrice:
        typeof fromFile?.defaultPrice === "number"
          ? fromFile.defaultPrice
          : BUILTIN_SETTINGS.defaultPrice,
      defaultName:
        typeof fromFile?.defaultName === "string" && fromFile.defaultName.trim()
          ? fromFile.defaultName.trim()
          : BUILTIN_SETTINGS.defaultName,
      shopOpen:
        typeof fromFile?.shopOpen === "boolean"
          ? fromFile.shopOpen
          : BUILTIN_SETTINGS.shopOpen,
      shippingFeeNgn:
        typeof fromFile?.shippingFeeNgn === "number"
          ? fromFile.shippingFeeNgn
          : BUILTIN_SETTINGS.shippingFeeNgn,
      paymentTimeoutMinutes:
        typeof fromFile?.paymentTimeoutMinutes === "number"
          ? fromFile.paymentTimeoutMinutes
          : BUILTIN_SETTINGS.paymentTimeoutMinutes,
    };
    const { error } = await supabase
      .from("shop_settings")
      .insert(settingsToRow(settings));
    if (error) throw new Error(error.message);
  }

  const { count: orderCount, error: orderErr } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true });
  if (orderErr) throw new Error(orderErr.message);

  if ((orderCount ?? 0) === 0) {
    const fromFile = await readJsonFile<Order[]>("orders.json");
    if (fromFile?.length) {
      const customerIds = [...new Set(fromFile.map((o) => o.customerId))];
      const customers: ShopCustomer[] = [];
      for (const id of customerIds) {
        const order = fromFile.find((o) => o.customerId === id);
        if (order) {
          customers.push({
            id,
            email: order.customerEmail,
            createdAt: order.createdAt,
          });
        }
      }
      if (customers.length) {
        const { error: custErr } = await supabase.from("shop_customers").upsert(
          customers.map((c) => ({
            id: c.id,
            email: c.email,
            created_at: c.createdAt,
          })),
          { onConflict: "id" },
        );
        if (custErr) throw new Error(custErr.message);
      }

      const { error } = await supabase
        .from("orders")
        .upsert(fromFile.map(orderToRow), { onConflict: "id" });
      if (error) throw new Error(error.message);
    }
  }

  const usersFile = await readJsonFile<ShopCustomer[]>("shop-users.json");
  if (usersFile?.length) {
    const { error } = await supabase.from("shop_customers").upsert(
      usersFile.map((c) => ({
        id: c.id,
        email: c.email,
        created_at: c.createdAt,
      })),
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (error) throw new Error(error.message);
  }
}

async function setupDatabase(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.",
    );
  }

  if (!(await tableExists())) {
    await runSchemaMigration();
  }

  await seedIfEmpty();
}

/** Call once per server process before any Supabase data access. */
export function ensureDbReady(): Promise<void> {
  if (!ready) {
    ready = setupDatabase().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}
