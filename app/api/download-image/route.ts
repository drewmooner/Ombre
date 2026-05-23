import { NextRequest, NextResponse } from "next/server";
import { getClientIpFromRequest } from "@/lib/security/client-ip";
import { rateLimitResponse } from "@/lib/security/rate-limit-response";
import {
  isHttpUrl,
  parseDownloadImageQuery,
} from "@/lib/security/validators";
import { isAllowedDownloadImageHost } from "@/lib/shop/image-url";

function resolveTarget(urlParam: string, origin: string): URL | null {
  try {
    return urlParam.startsWith("/")
      ? new URL(urlParam, origin)
      : new URL(urlParam);
  } catch {
    return null;
  }
}

function isAllowedUrl(target: URL, requestOrigin: string): boolean {
  if (target.origin === requestOrigin) return true;
  return isAllowedDownloadImageHost(target.hostname);
}

export async function GET(request: NextRequest) {
  const limited = rateLimitResponse(
    "api-download-image",
    getClientIpFromRequest(request),
    { max: 30, windowMs: 60_000 },
  );
  if (limited) return limited;

  const parsed = parseDownloadImageQuery(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (!isHttpUrl(parsed.url) && !parsed.url.startsWith("/")) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const target = resolveTarget(parsed.url, request.nextUrl.origin);
  if (!target || !isAllowedUrl(target, request.nextUrl.origin)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const upstream = await fetch(target.toString());
  if (!upstream.ok) {
    return NextResponse.json({ error: "Could not fetch image" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${parsed.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
