import { randomUUID } from "crypto";
import type { ShopCustomer } from "./shop-types";
import { prepareDb, usesSupabase } from "./db-backend";
import * as json from "./json-data";
import { getSupabaseAdmin } from "./supabase/admin";
import { customerFromRow } from "./supabase/mappers";

export async function findOrCreateShopUser(email: string): Promise<ShopCustomer> {
  const normalized = email.trim().toLowerCase();
  if (!usesSupabase()) return json.jsonFindOrCreateShopUser(normalized);

  await prepareDb();
  const supabase = getSupabaseAdmin();

  const { data: existing, error: findErr } = await supabase
    .from("shop_customers")
    .select("*")
    .eq("email", normalized)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (existing) return customerFromRow(existing);

  const user: ShopCustomer = {
    id: randomUUID(),
    email: normalized,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from("shop_customers").insert({
    id: user.id,
    email: user.email,
    created_at: user.createdAt,
  });
  if (error) throw new Error(error.message);
  return user;
}

export async function findShopUserById(id: string): Promise<ShopCustomer | null> {
  if (!usesSupabase()) return json.jsonFindShopUserById(id);
  await prepareDb();
  const { data, error } = await getSupabaseAdmin()
    .from("shop_customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? customerFromRow(data) : null;
}
