import { prepareDb, usesSupabase } from "./db-backend";
import * as json from "./json-data";
import { getSupabaseAdmin } from "./supabase/admin";
import { settingsFromRow, settingsToRow } from "./supabase/mappers";

export type ShopSettings = {
  defaultPrice: number;
  defaultName: string;
  shopOpen: boolean;
  shippingFeeNgn: number;
  paymentTimeoutMinutes: number;
};

const SETTINGS_ID = "default";
export const ORDER_PAYMENT_TIMEOUT_MINUTES = 30;

const BUILTIN: ShopSettings = {
  defaultPrice: 12000,
  defaultName: "Handkerchief 2pcs",
  shopOpen: true,
  shippingFeeNgn: 0,
  paymentTimeoutMinutes: ORDER_PAYMENT_TIMEOUT_MINUTES,
};

function normalizeSettings(settings: ShopSettings): ShopSettings {
  return {
    ...settings,
    paymentTimeoutMinutes: ORDER_PAYMENT_TIMEOUT_MINUTES,
  };
}

async function readSettings(): Promise<ShopSettings> {
  if (!usesSupabase()) return normalizeSettings(await json.jsonGetShopSettings());
  await prepareDb();
  const { data, error } = await getSupabaseAdmin()
    .from("shop_settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return normalizeSettings(data ? settingsFromRow(data) : BUILTIN);
}

async function writeSettings(settings: ShopSettings): Promise<void> {
  const normalized = normalizeSettings(settings);
  if (!usesSupabase()) {
    await json.jsonWriteShopSettings(normalized);
    return;
  }
  await prepareDb();
  const { error } = await getSupabaseAdmin()
    .from("shop_settings")
    .upsert(settingsToRow(normalized), { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export async function getShopSettings(): Promise<ShopSettings> {
  return readSettings();
}

export async function isShopOpen(): Promise<boolean> {
  const settings = await readSettings();
  return settings.shopOpen;
}

export async function setShopOpen(open: boolean): Promise<void> {
  const settings = await readSettings();
  await writeSettings({ ...settings, shopOpen: open });
}

export async function updateDefaultPrice(price: number): Promise<void> {
  if (!Number.isFinite(price) || price < 0) return;
  const settings = await readSettings();
  await writeSettings({ ...settings, defaultPrice: Math.round(price) });
}
