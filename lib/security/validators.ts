const MAX_URL_PARAM_LEN = 2048;
const MAX_FILENAME_LEN = 120;
const MAX_WEBHOOK_BODY = 256 * 1024;

const PAYSTACK_REF_RE = /^[a-zA-Z0-9._-]{8,128}$/;

export type DownloadImageQuery =
  | { ok: true; url: string; filename: string }
  | { ok: false; error: string };

export function parseDownloadImageQuery(
  searchParams: URLSearchParams,
): DownloadImageQuery {
  const urlParam = searchParams.get("url");
  if (!urlParam?.trim()) {
    return { ok: false, error: "Missing url" };
  }
  if (urlParam.length > MAX_URL_PARAM_LEN) {
    return { ok: false, error: "URL too long" };
  }

  const filenameRaw = searchParams.get("filename");
  const filename =
    filenameRaw == null
      ? "product-image.jpg"
      : filenameRaw.trim().slice(0, MAX_FILENAME_LEN).replace(/[^\w.\-]/g, "_") ||
        "product-image.jpg";

  if (filename.length > MAX_FILENAME_LEN) {
    return { ok: false, error: "Filename too long" };
  }

  return { ok: true, url: urlParam.trim(), filename };
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export type PaystackWebhookPayload = {
  event: string;
  data?: {
    reference?: string;
    metadata?: Record<string, unknown>;
  };
};

export function parsePaystackWebhookBody(
  rawBody: string,
): { ok: true; payload: PaystackWebhookPayload } | { ok: false; error: string } {
  if (rawBody.length > MAX_WEBHOOK_BODY) {
    return { ok: false, error: "Payload too large" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Invalid payload" };
  }

  const event = (parsed as { event?: unknown }).event;
  if (typeof event !== "string" || event.length > 64) {
    return { ok: false, error: "Invalid event" };
  }

  const data = (parsed as { data?: unknown }).data;
  if (data !== undefined && (typeof data !== "object" || data === null)) {
    return { ok: false, error: "Invalid data" };
  }

  const reference = (data as { reference?: unknown } | undefined)?.reference;
  if (reference !== undefined && typeof reference !== "string") {
    return { ok: false, error: "Invalid reference" };
  }
  if (typeof reference === "string" && !PAYSTACK_REF_RE.test(reference.trim())) {
    return { ok: false, error: "Invalid reference" };
  }

  const metadata = (data as { metadata?: unknown } | undefined)?.metadata;
  if (
    metadata !== undefined &&
    (typeof metadata !== "object" || metadata === null || Array.isArray(metadata))
  ) {
    return { ok: false, error: "Invalid metadata" };
  }

  return {
    ok: true,
    payload: parsed as PaystackWebhookPayload,
  };
}

export function normalizeShopEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase().slice(0, 254);
  if (!email || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function normalizeOtpCode(raw: string): string | null {
  const code = raw.trim().replace(/\s/g, "").slice(0, 12);
  if (!/^\d{6}$/.test(code)) return null;
  return code;
}

export function normalizeRedirectPath(raw: string): string {
  const next = raw.trim();
  if (next.startsWith("/") && !next.startsWith("//") && next.length <= 256) {
    return next;
  }
  return "/";
}
