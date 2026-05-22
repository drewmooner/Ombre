import type { RateLimitConfig, RateLimitResult } from "./rate-limit";
import { checkRateLimit } from "./rate-limit";

export function rateLimitResponse(
  bucket: string,
  key: string,
  config: RateLimitConfig,
): Response | null {
  const result = checkRateLimit(bucket, key, config);
  if (result.ok) return null;
  return tooManyRequests(result);
}

export function tooManyRequests(result: Extract<RateLimitResult, { ok: false }>): Response {
  return Response.json(
    { error: "Too many requests. Try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    },
  );
}
