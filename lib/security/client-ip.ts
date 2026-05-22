import type { NextRequest } from "next/server";

function firstForwardedIp(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

export function getClientIpFromRequest(request: NextRequest | Request): string {
  const h = request.headers;
  return (
    firstForwardedIp(h.get("x-forwarded-for")) ??
    h.get("x-real-ip")?.trim() ??
    h.get("cf-connecting-ip")?.trim() ??
    "unknown"
  );
}

export function getClientIpFromHeaders(
  headers: { get(name: string): string | null },
): string {
  return (
    firstForwardedIp(headers.get("x-forwarded-for")) ??
    headers.get("x-real-ip")?.trim() ??
    headers.get("cf-connecting-ip")?.trim() ??
    "unknown"
  );
}
