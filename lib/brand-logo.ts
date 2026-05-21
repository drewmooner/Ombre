/** Public path — keep in sync with `app/logo.png` (copied to `public/logo.png` for static URLs). */
export const BRAND_LOGO_PATH = "/logo.png";

export function brandLogoAbsoluteUrl(origin?: string): string | null {
  const base = (origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (!base) return null;
  return `${base}${BRAND_LOGO_PATH}`;
}

/** Email header: logo image when `NEXT_PUBLIC_APP_URL` is set, otherwise wordmark text. */
/** Email header logo width (px) — keep in sync with `BRAND_LOGO_SIZES`. */
export const EMAIL_BRAND_LOGO_WIDTH = 72;

export function emailBrandLogoHtml(width = EMAIL_BRAND_LOGO_WIDTH): string {
  const url = brandLogoAbsoluteUrl();
  if (!url) {
    return `<p style="margin:0;font-family:Georgia,serif;font-size:26px;color:#722f37;">Ombré</p>`;
  }
  return `<img src="${url}" alt="Ombré" width="${width}" style="display:block;margin:0 auto 8px;max-width:${width}px;height:auto;" />`;
}
