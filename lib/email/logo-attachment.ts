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

let cachedAttachment: ResendLogoAttachment | null = null;

export function getEmailLogoAttachment(): ResendLogoAttachment {
  if (cachedAttachment) return cachedAttachment;

  const path = join(process.cwd(), "public", "logo.png");
  const buf = readFileSync(path);
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
  return `<img src="cid:${EMAIL_LOGO_CID}" alt="Ombré" width="${width}" style="display:block;margin:0 auto 8px;max-width:${width}px;height:auto;" />`;
}
