import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { getShopSettings } from "@/lib/shop-settings";

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "catalog-settings.json");

type CatalogSettingsFile = Record<string, { defaultPrice?: number }>;

async function readSettings(): Promise<CatalogSettingsFile> {
  try {
    const raw = await readFile(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as CatalogSettingsFile;
  } catch {
    return {};
  }
}

async function writeSettings(settings: CatalogSettingsFile): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

function catalogKey(settings: CatalogSettingsFile, catalog: string): string {
  const lower = catalog.toLowerCase();
  const existing = Object.keys(settings).find((k) => k.toLowerCase() === lower);
  return existing ?? catalog;
}

export async function getCatalogDefaultPrices(
  catalogs: string[],
): Promise<Record<string, number>> {
  const settings = await readSettings();
  const { defaultPrice: shopFallback } = await getShopSettings();
  const prices: Record<string, number> = {};

  for (const catalog of catalogs) {
    const key = catalogKey(settings, catalog);
    const stored = settings[key]?.defaultPrice;
    if (typeof stored === "number" && stored >= 0) {
      prices[catalog] = stored;
      continue;
    }
    if (shopFallback >= 0) {
      prices[catalog] = shopFallback;
    }
  }

  return prices;
}

export async function getCatalogDefaultPrice(catalog: string): Promise<number | undefined> {
  const map = await getCatalogDefaultPrices([catalog]);
  return map[catalog];
}

/** First price saved for a catalog becomes the default for new listings in that catalog. */
export async function removeCatalogSettings(catalog: string): Promise<void> {
  const settings = await readSettings();
  const key = catalogKey(settings, catalog);
  if (!(key in settings)) return;
  delete settings[key];
  await writeSettings(settings);
}

export async function setCatalogDefaultPriceIfUnset(
  catalog: string,
  price: number,
): Promise<void> {
  if (!Number.isFinite(price) || price < 0) return;

  const settings = await readSettings();
  const key = catalogKey(settings, catalog);

  if (typeof settings[key]?.defaultPrice === "number") {
    return;
  }

  settings[key] = { ...settings[key], defaultPrice: Math.round(price) };
  await writeSettings(settings);
}
