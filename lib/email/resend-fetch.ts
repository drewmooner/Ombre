import https from "node:https";
import { Resolver } from "node:dns";

const RESEND_HOST = "api.resend.com";
const TRANSIENT_CODES = new Set([
  "EAI_AGAIN",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNRESET",
  "EPIPE",
]);

/** Public DNS — avoids flaky router DNS that causes EAI_AGAIN on Node fetch. */
const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

function resolveResendIPv4(): Promise<string> {
  return new Promise((resolve, reject) => {
    resolver.resolve4(RESEND_HOST, (err, addresses) => {
      if (err) {
        reject(err);
        return;
      }
      const ip = addresses?.[0];
      if (!ip) reject(new Error(`No IPv4 address for ${RESEND_HOST}`));
      else resolve(ip);
    });
  });
}

function headersToRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return { ...headers };
}

function httpsRequest(
  url: string,
  ip: string,
  method: string,
  headers: Record<string, string>,
  body?: string,
): Promise<{ status: number; body: string }> {
  const u = new URL(url);
  const payload = body ?? "";

  return new Promise((resolve, reject) => {
    const reqHeaders: Record<string, string> = {
      ...headers,
      host: u.hostname,
    };
    if (payload) {
      reqHeaders["Content-Length"] = String(Buffer.byteLength(payload));
    }

    const req = https.request(
      {
        host: ip,
        port: 443,
        method,
        path: u.pathname + u.search,
        headers: reqHeaders,
        servername: u.hostname,
        family: 4,
        timeout: 25_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Resend request timed out"));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

function isTransientNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const cause = err.cause;
  const code =
    (cause instanceof Error && "code" in cause
      ? (cause as NodeJS.ErrnoException).code
      : undefined) ??
    ("code" in err ? (err as NodeJS.ErrnoException).code : undefined);
  return code != null && TRANSIENT_CODES.has(code);
}

export function formatNetworkError(err: unknown): string {
  if (!(err instanceof Error)) return "Network error";
  const cause = err.cause instanceof Error ? err.cause.message : "";
  return cause ? `${err.message}: ${cause}` : err.message;
}

/**
 * POST/GET to Resend API using public DNS + direct HTTPS (SNI preserved).
 * Works when system DNS intermittently returns EAI_AGAIN / ENOTFOUND.
 */
export async function fetchResend(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const method = init.method ?? "GET";
  const headers = headersToRecord(init.headers);
  const body =
    typeof init.body === "string"
      ? init.body
      : init.body == null
        ? undefined
        : String(init.body);

  const delaysMs = [0, 500, 1200, 2500];
  let last: unknown;

  for (let attempt = 0; attempt < delaysMs.length; attempt++) {
    if (delaysMs[attempt] > 0) {
      await new Promise((r) => setTimeout(r, delaysMs[attempt]));
    }
    try {
      const ip = await resolveResendIPv4();
      const result = await httpsRequest(url, ip, method, headers, body);
      return new Response(result.body, { status: result.status });
    } catch (err) {
      last = err;
      const transient = isTransientNetworkError(err);
      const lastAttempt = attempt === delaysMs.length - 1;
      if (!transient || lastAttempt) break;
      console.warn(
        `[email] Resend unreachable (attempt ${attempt + 1}/${delaysMs.length}), retrying…`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  throw last;
}
