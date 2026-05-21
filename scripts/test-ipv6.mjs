import postgres from "postgres";

const pass = process.env.SUPABASE_DB_PASSWORD || "drewmooner191";
const host = "2a05:d014:128e:9500:5f64:8061:5de:1d3f";
const url = `postgresql://postgres:${encodeURIComponent(pass)}@[${host}]:5432/postgres?sslmode=require`;
console.log(url.replace(pass, "***"));

const sql = postgres(url, { max: 1, connect_timeout: 12, prepare: false });
try {
  await sql`select 1 as ok`;
  console.log("IPv6 URL OK");
  await sql.end({ timeout: 3 });
} catch (e) {
  console.log("FAIL", e.code, e.message);
  try {
    await sql.end({ timeout: 1 });
  } catch {
    /* ignore */
  }
  process.exit(1);
}
