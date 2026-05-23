import { NextResponse, type NextRequest } from "next/server";
import { getClientIpFromRequest } from "@/lib/security/client-ip";
import { checkRateLimit } from "@/lib/security/rate-limit";

function limitForPath(pathname: string): { bucket: string; max: number; windowMs: number } {
  if (pathname.startsWith("/api/shop/catalog-products")) {
    return { bucket: "api-shop-catalog-products", max: 120, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/download-image")) {
    return { bucket: "api-download-image", max: 30, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/shop/image")) {
    return { bucket: "api-shop-image", max: 120, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/paystack/webhook")) {
    return { bucket: "api-paystack-webhook", max: 120, windowMs: 60_000 };
  }
  return { bucket: "api-default", max: 60, windowMs: 60_000 };
}

export function middleware(request: NextRequest) {
  const { bucket, max, windowMs } = limitForPath(request.nextUrl.pathname);
  const ip = getClientIpFromRequest(request);
  const result = checkRateLimit(bucket, ip, { max, windowMs });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(result.retryAfterSeconds) },
      },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
