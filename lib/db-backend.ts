import { isSupabaseConfigured } from "./supabase/config";
import { ensureDbReady } from "./supabase/setup";

export function usesSupabase(): boolean {
  return isSupabaseConfigured();
}

export async function prepareDb(): Promise<void> {
  if (usesSupabase()) await ensureDbReady();
}
