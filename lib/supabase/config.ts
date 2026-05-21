import { envVar } from "@/lib/env";

export function getSupabaseUrl(): string | undefined {
  return envVar("NEXT_PUBLIC_SUPABASE_URL")?.replace(/\/$/, "");
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return envVar("SUPABASE_SERVICE_ROLE_KEY");
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

function projectRef(): string | undefined {
  const url = getSupabaseUrl();
  return (
    envVar("SUPABASE_PROJECT_REF") ?? url?.match(/https:\/\/([^.]+)\./)?.[1]
  );
}

function passwordFromUrl(url: string): string | undefined {
  try {
    return decodeURIComponent(new URL(url).password);
  } catch {
    return undefined;
  }
}

/** Build Session pooler URL (IPv4-friendly; works on Windows without IPv6). */
export function buildPoolerDatabaseUrl(
  password: string,
  region = envVar("SUPABASE_DB_POOLER_REGION") ?? "eu-central-1",
  port = 5432,
): string | undefined {
  const ref = projectRef();
  if (!ref || !password) return undefined;
  const poolerGeneration = envVar("SUPABASE_POOLER_GENERATION") ?? "1";
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-${poolerGeneration}-${region}.pooler.supabase.com:${port}/postgres`;
}

/**
 * Postgres URL for schema setup.
 * Rewrites direct `db.*.supabase.co` URLs to the Session pooler (direct host is IPv6-only).
 */
export function getDatabaseUrl(): string | undefined {
  const poolerOverride = envVar("DATABASE_URL_POOLER");
  if (poolerOverride) return poolerOverride;

  const direct = envVar("DATABASE_URL");
  const password = envVar("SUPABASE_DB_PASSWORD") ?? (direct ? passwordFromUrl(direct) : undefined);

  if (direct?.includes("db.") && direct.includes(".supabase.co") && password) {
    return buildPoolerDatabaseUrl(password) ?? direct;
  }

  if (direct) return direct;

  if (password) return buildPoolerDatabaseUrl(password);

  return undefined;
}
