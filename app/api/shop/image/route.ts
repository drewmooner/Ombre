import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getClientIpFromRequest } from "@/lib/security/client-ip";
import { rateLimitResponse } from "@/lib/security/rate-limit-response";
import { isSupabaseStorageUrl } from "@/lib/supabase/storage";

const PLACEHOLDER_PATH = path.join(process.cwd(), "public", "logo.png");

function isSafeUploadPath(pathname: string): boolean {
  return (
    pathname.startsWith("/uploads/") &&
    !pathname.includes("..") &&
    /^\/uploads\/[a-zA-Z0-9._-]+$/.test(pathname)
  );
}

export async function GET(request: NextRequest) {
  const limited = rateLimitResponse(
    "api-shop-image",
    getClientIpFromRequest(request),
    { max: 120, windowMs: 60_000 },
  );
  if (limited) return limited;

  const raw = request.nextUrl.searchParams.get("path")?.trim() ?? "";
  if (!raw) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  let target: URL;
  try {
    target = raw.startsWith("/")
      ? new URL(raw, request.nextUrl.origin)
      : new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (isSafeUploadPath(target.pathname)) {
    const filePath = path.join(
      process.cwd(),
      "public",
      target.pathname.slice(1),
    );
    try {
      const buffer = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const type =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".gif"
              ? "image/gif"
              : "image/jpeg";
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    } catch {
      const placeholder = await readFile(PLACEHOLDER_PATH);
      return new NextResponse(placeholder, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
          "X-Shop-Image-Fallback": "1",
        },
      });
    }
  }

  if (
    target.protocol === "https:" &&
    isSupabaseStorageUrl(target.toString())
  ) {
    const upstream = await fetch(target.toString(), { next: { revalidate: 3600 } });
    if (upstream.ok && upstream.body) {
      return new NextResponse(upstream.body, {
        headers: {
          "Content-Type":
            upstream.headers.get("content-type") ?? "image/jpeg",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }
    const placeholder = await readFile(PLACEHOLDER_PATH);
    return new NextResponse(placeholder, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        "X-Shop-Image-Fallback": "1",
      },
    });
  }

  return NextResponse.json({ error: "Not allowed" }, { status: 403 });
}
