import { envVar } from "@/lib/env";
import {
  emailBrandLogoHtml,
  getEmailLogoAttachment,
} from "@/lib/email/logo-attachment";
import { fetchResend, formatNetworkError } from "@/lib/email/resend-fetch";

const RESEND_API = "https://api.resend.com";
const AUTH_FROM_FALLBACK = "0mbré Auth <auth@0mbre.shop>";
const ORDERS_FROM_FALLBACK = "0mbré Orders <orders@0mbre.shop>";

export type EmailSender = "auth" | "orders";

function getResendApiKey(): string | undefined {
  return envVar("RESEND_API_KEY");
}

function getFromAddress(sender: EmailSender): string {
  if (sender === "auth") {
    return envVar("RESEND_FROM_AUTH") || envVar("RESEND_FROM") || AUTH_FROM_FALLBACK;
  }
  return envVar("RESEND_FROM_ORDERS") || envVar("RESEND_FROM") || ORDERS_FROM_FALLBACK;
}

export function isEmailConfigured(): boolean {
  return Boolean(getResendApiKey());
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  sender?: EmailSender;
  /** When false, omit inline logo attachment. Defaults to true. */
  includeLogo?: boolean;
}): Promise<SendEmailResult> {
  const key = getResendApiKey();
  if (!key) {
    console.warn("[email] RESEND_API_KEY missing — not sent:", options.subject, "→", options.to);
    return {
      ok: false,
      error:
        "RESEND_API_KEY is missing from .env — add your Resend key and restart npm run dev",
    };
  }

  let response: Response;
  try {
    response = await fetchResend(`${RESEND_API}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromAddress(options.sender ?? "orders"),
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments:
          options.includeLogo === false
            ? undefined
            : (() => {
                const logo = getEmailLogoAttachment();
                return logo ? [logo] : undefined;
              })(),
      }),
    });
  } catch (err) {
    const message = formatNetworkError(err);
    console.error("[email] Fetch failed after retries:", message);
    return { ok: false, error: message };
  }

  const body = (await response.json().catch(() => null)) as {
    id?: string;
    message?: string;
  } | null;

  if (!response.ok) {
    const message = body?.message ?? response.statusText ?? "Resend request failed";
    console.error("[email] Resend error:", message);
    return { ok: false, error: message };
  }

  return { ok: true, id: body?.id ?? "" };
}

function buildOmbreOtpEmail(code: string) {
  const subject = `${code} is your 0mbré sign-in code`;
  const text = [
    "0mbré",
    "",
    "Here’s your one-time code to finish signing in — quick and secure.",
    "",
    `${code}`,
    "",
    "Enter it on the 0mbré website within 10 minutes. After that, enter your email again on the login page and we’ll send a new code.",
    "",
    "Nobody at 0mbré will ask for this code by phone, WhatsApp, DM, or reply to this email.",
    "",
    "Need another code? Go to the login page and request one with the same email.",
    "",
    "Didn’t try to sign in? Ignore this message — your account is unchanged.",
    "",
    "— 0mbré",
    "Curated fashion wears · Nigeria",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your 0mbré sign-in code</title>
</head>
<body style="margin:0;padding:0;background-color:#f3eeec;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3eeec;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:420px;background-color:#fffbf9;border:1px solid rgba(114,47,55,0.12);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(180deg,rgba(114,47,55,0.08) 0%,transparent 100%);padding:28px 28px 20px;text-align:center;border-bottom:1px solid rgba(114,47,55,0.08);">
              ${emailBrandLogoHtml()}
              <p style="margin:8px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#9a5a63;">Sign in</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.4;color:#2a2224;">Almost there</p>
              <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#73666a;">
                Enter this one-time code on the 0mbré website to open your account. It’s valid for <strong style="color:#2a2224;">10 minutes</strong> — after that, use the login page to request a fresh code.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;text-align:center;">
              <div style="display:inline-block;padding:16px 28px;background-color:rgba(114,47,55,0.06);border:1px solid rgba(114,47,55,0.14);border-radius:12px;">
                <p style="margin:0;font-family:ui-monospace,'SF Mono',Consolas,monospace;font-size:32px;font-weight:600;letter-spacing:0.28em;color:#722f37;">${code}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:13px;line-height:1.55;color:#73666a;text-align:center;">
                We’ll never ask for this code by phone, DM, or email reply. Not you? You can ignore this — your account stays as it was.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;background-color:rgba(114,47,55,0.04);border-top:1px solid rgba(114,47,55,0.08);text-align:center;">
              <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:12px;line-height:1.5;color:#9a5a63;">
                0mbré · Curated fashion wears<br />Nigeria · NGN
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return { subject, html, text };
}

export async function sendOtpEmail(
  to: string,
  code: string,
): Promise<SendEmailResult> {
  const { subject, html, text } = buildOmbreOtpEmail(code);

  const result = await sendEmail({
    to,
    subject,
    html,
    text,
    sender: "auth",
  });

  if (process.env.NODE_ENV !== "production" && result.ok) {
    console.info(`[email] OTP sent to ${to} (id: ${result.id})`);
  }

  return result;
}
