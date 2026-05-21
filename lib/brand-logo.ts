/** Public path — keep in sync with `app/logo.png` (copied to `public/logo.png`). */
export const BRAND_LOGO_PATH = "/logo.png";

export function brandLogoAbsoluteUrl(origin?: string): string | null {
  const base = (origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (!base) return null;
  return `${base}${BRAND_LOGO_PATH}`;
}
