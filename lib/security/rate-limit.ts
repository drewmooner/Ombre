/**
 * In-memory rate limits (per server instance).
 * On Vercel with many instances, add Vercel Firewall or Upstash Redis for global limits.
 */

export type RateLimitConfig = {
  max: number;
  windowMs: number;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

function isDisabled(): boolean {
  return process.env.RATE_LIMIT_DISABLED === "true";
}

export function checkRateLimit(
  bucket: string,
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  if (isDisabled()) return { ok: true };

  const now = Date.now();
  const id = `${bucket}:${key}`;
  const existing = buckets.get(id);

  if (!existing || now >= existing.resetAt) {
    buckets.set(id, { count: 1, resetAt: now + config.windowMs });
    return { ok: true };
  }

  if (existing.count >= config.max) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    );
    return { ok: false, retryAfterSeconds };
  }

  existing.count += 1;
  return { ok: true };
}

/** Drop stale entries occasionally so memory does not grow forever. */
export function pruneRateLimitBuckets(): void {
  const now = Date.now();
  for (const [id, entry] of buckets) {
    if (now >= entry.resetAt) buckets.delete(id);
  }
}

if (typeof setInterval !== "undefined") {
  setInterval(pruneRateLimitBuckets, 10 * 60_000).unref?.();
}
