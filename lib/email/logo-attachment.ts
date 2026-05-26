import "server-only";

import { readFileSync } from "fs";
import { join } from "path";

/** Inline logo for Resend — referenced as `cid:ombre-logo` in HTML. */
export const EMAIL_LOGO_CID = "ombre-logo";

export const EMAIL_BRAND_LOGO_WIDTH = 72;

export type ResendLogoAttachment = {
  filename: string;
  content: string;
  content_id: string;
};

let cachedAttachment: ResendLogoAttachment | null | undefined;

function readLogoBytes(): Buffer | null {
  for (const filePath of [
    join(process.cwd(), "public", "logo.png"),
    join(process.cwd(), "app", "logo.png"),
  ]) {
    try {
      return readFileSync(filePath);
    } catch {
      /* try next path */
    }
  }
  return null;
}

export function getEmailLogoAttachment(): ResendLogoAttachment | null {
  if (cachedAttachment !== undefined) return cachedAttachment;

  const buf = readLogoBytes();
  if (!buf) {
    console.warn("[email] Logo file missing — sending without inline attachment");
    cachedAttachment = null;
    return null;
  }

  cachedAttachment = {
    filename: "logo.png",
    content: buf.toString("base64"),
    content_id: EMAIL_LOGO_CID,
  };
  return cachedAttachment;
}

export function emailBrandLogoHtml(
  width = EMAIL_BRAND_LOGO_WIDTH,
): string {
  if (!getEmailLogoAttachment()) {
    return `<p style="margin:0;font-family:Georgia,serif;font-size:26px;color:#722f37;">0mbré</p>`;
  }
  return `<img src="cid:${EMAIL_LOGO_CID}" alt="0mbré" width="${width}" style="display:block;margin:0 auto 8px;max-width:${width}px;height:auto;" />`;
}
