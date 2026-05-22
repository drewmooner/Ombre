import pg from "pg";
import { getDatabaseUrl } from "./config";
import { productFromRow, type ProductRow } from "./mappers";
import type { Product } from "@/lib/product-types";

const { Client } = pg;

async function withPgClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
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

/** Atomically reserve stock — only succeeds if enough pieces remain at commit time. */
export async function atomicDeductProductPieces(
  productId: string,
  quantity: number,
): Promise<Product> {
  const qty = Math.max(0, Math.round(quantity));

  return withPgClient(async (client) => {
    const { rows } = await client.query<ProductRow>(
      `UPDATE products
       SET pieces = pieces - $1,
           in_stock = (pieces - $1) > 0
       WHERE id = $2 AND pieces >= $1
       RETURNING *`,
      [qty, productId],
    );

    if (rows.length > 0) {
      return productFromRow(rows[0]);
    }

    const { rows: current } = await client.query<ProductRow>(
      `SELECT * FROM products WHERE id = $1`,
      [productId],
    );
    const product = current[0];
    if (!product) throw new Error("Product not found");

    throw new Error(
      product.pieces === 0
        ? `${product.name} is out of stock`
        : `Only ${product.pieces} left for ${product.name}`,
    );
  });
}

/** Return reserved pieces to inventory (expired checkout, failed order, etc.). */
export async function atomicRestoreProductPieces(
  productId: string,
  quantity: number,
): Promise<Product> {
  const qty = Math.max(0, Math.round(quantity));

  return withPgClient(async (client) => {
    const { rows } = await client.query<ProductRow>(
      `UPDATE products
       SET pieces = pieces + $1,
           in_stock = true
       WHERE id = $2
       RETURNING *`,
      [qty, productId],
    );

    if (rows.length === 0) throw new Error("Product not found");
    return productFromRow(rows[0]);
  });
}
