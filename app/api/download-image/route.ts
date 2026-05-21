import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["images.unsplash.com"]);

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
  return ALLOWED_HOSTS.has(target.hostname);
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const target = resolveTarget(urlParam, request.nextUrl.origin);
  if (!target || !isAllowedUrl(target, request.nextUrl.origin)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const upstream = await fetch(target.toString());
  if (!upstream.ok) {
    return NextResponse.json({ error: "Could not fetch image" }, { status: 502 });
  }

  const filename =
    request.nextUrl.searchParams.get("filename")?.replace(/[^\w.\-]/g, "_") ??
    "product-image.jpg";

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
