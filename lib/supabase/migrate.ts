import pg from "pg";
import { getDatabaseUrl } from "./config";
import { RLS_SQL } from "./rls.sql";
import { CATALOG_SORT_ORDER_SQL, ORDER_EMAIL_FIELDS_SQL, SCHEMA_SQL } from "./schema.sql";

const { Client } = pg;

function isNetworkUnreachable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err ? String((err as { code?: string }).code) : "";
  return (
    code === "ENOTFOUND" ||
    code === "ENETUNREACH" ||
    code === "EHOSTUNREACH" ||
    code === "ETIMEDOUT"
  );
}

function isBenignSchemaRace(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err ? String((err as { code?: string }).code) : "";
  const message = "message" in err ? String((err as { message?: string }).message) : "";
  return (
    code === "23505" &&
    (message.includes("pg_type_typname_nsp_index") ||
      message.includes("already exists"))
  );
}

function sqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function schemaStatements(): string[] {
  return sqlStatements(SCHEMA_SQL);
}

function rlsStatements(): string[] {
  return sqlStatements(RLS_SQL);
}

async function withClient<T>(
  fn: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "Add DATABASE_URL to .env (use the Session pooler URI from Supabase → Connect, not the direct db.* host).",
    );
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  });

  try {
    await client.connect();
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

/** Check Postgres directly (more reliable than REST right after bootstrap). */
export async function isSchemaApplied(): Promise<boolean> {
  return withClient(async (client) => {
    const { rows } = await client.query<{ exists: boolean }>(`
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'catalogs'
      ) as exists
    `);
    return rows[0]?.exists === true;
  });
}

export async function runSchemaMigration(): Promise<void> {
  if (await isSchemaApplied()) return;

  try {
    await withClient(async (client) => {
      for (const statement of schemaStatements()) {
        await client.query(statement);
      }
    });
  } catch (err) {
    if (isBenignSchemaRace(err) && (await isSchemaApplied())) {
      return;
    }
    if (isNetworkUnreachable(err)) {
      throw new Error(
        "Could not reach Supabase Postgres. Use the Session pooler connection string in DATABASE_URL (host like aws-1-REGION.pooler.supabase.com), not db.PROJECT.supabase.co — see supabase/bootstrap.sql if you prefer to run SQL manually in the dashboard.",
        { cause: err },
      );
    }
    throw err;
  }
}

/** Idempotent — catalog display order for admin + shop home. */
export async function runCatalogSortOrderMigration(): Promise<void> {
  if (!(await isSchemaApplied())) return;

  await withClient(async (client) => {
    for (const statement of sqlStatements(CATALOG_SORT_ORDER_SQL)) {
      await client.query(statement);
    }
  });
}

/** Idempotent — adds order email sent markers for idempotent customer emails. */
export async function runOrderEmailFieldsMigration(): Promise<void> {
  if (!(await isSchemaApplied())) return;

  await withClient(async (client) => {
    for (const statement of sqlStatements(ORDER_EMAIL_FIELDS_SQL)) {
      await client.query(statement);
    }
  });
}

/** Idempotent — enables RLS with no anon/authenticated policies (server uses service role). */
export async function runRlsMigration(): Promise<void> {
  if (!(await isSchemaApplied())) return;

  await withClient(async (client) => {
    for (const statement of rlsStatements()) {
      await client.query(statement);
    }
  });
}
