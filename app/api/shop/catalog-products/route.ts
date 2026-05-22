import { NextRequest, NextResponse } from "next/server";
import { getCatalogProductsPage } from "@/lib/catalogs.server";
import { getClientIpFromRequest } from "@/lib/security/client-ip";
import { rateLimitResponse } from "@/lib/security/rate-limit-response";
import { SHOP_PRODUCTS_PAGE_SIZE } from "@/lib/shop/pagination";

const CATALOG_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

export async function GET(request: NextRequest) {
  const limited = rateLimitResponse(
    "api-shop-catalog-products",
    getClientIpFromRequest(request),
    { max: 120, windowMs: 60_000 },
  );
  if (limited) return limited;

  const catalogId = request.nextUrl.searchParams.get("catalogId")?.trim() ?? "";
  if (!CATALOG_ID_RE.test(catalogId)) {
    return NextResponse.json({ error: "Invalid catalog" }, { status: 400 });
  }

  const offsetRaw = Number(request.nextUrl.searchParams.get("offset") ?? "0");
  const offset = Number.isFinite(offsetRaw)
    ? Math.max(0, Math.floor(offsetRaw))
    : 0;

  const page = await getCatalogProductsPage(catalogId, offset);
  if (!page) {
    return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  }

  return NextResponse.json({
    products: page.products,
    total: page.total,
    offset: page.offset,
    limit: page.limit ?? SHOP_PRODUCTS_PAGE_SIZE,
    hasMore: page.hasMore,
  });
}
