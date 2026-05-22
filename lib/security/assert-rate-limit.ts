import { headers } from "next/headers";
import { getClientIpFromHeaders } from "./client-ip";
import { checkRateLimit, type RateLimitConfig } from "./rate-limit";

export async function assertRateLimit(
  bucket: string,
  config: RateLimitConfig,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = getClientIpFromHeaders(await headers());
  const result = checkRateLimit(bucket, ip, config);
  if (result.ok) return { ok: true };
  return {
    ok: false,
    error: `Too many attempts. Wait ${result.retryAfterSeconds}s and try again.`,
  };
}
