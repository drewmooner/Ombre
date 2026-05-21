import Image from "next/image";
import logo from "@/app/logo.png";

/** Display widths (px) — one place to tune logo size across the app. */
export const BRAND_LOGO_SIZES = {
  header: 32,
  storeNav: 30,
  footer: 40,
  shopClosed: 52,
  auth: 40,
  checkout: 44,
} as const;

export type BrandLogoSize = keyof typeof BRAND_LOGO_SIZES;

type BrandLogoProps = {
  size?: number | BrandLogoSize;
  className?: string;
  priority?: boolean;
};

function resolveSize(size: number | BrandLogoSize | undefined): number {
  if (size === undefined) return BRAND_LOGO_SIZES.header;
  if (typeof size === "number") return size;
  return BRAND_LOGO_SIZES[size];
}

export function BrandLogo({
  size,
  className = "",
  priority = false,
}: BrandLogoProps) {
  const width = resolveSize(size);
  const height = Math.max(1, Math.round((logo.height / logo.width) * width));

  return (
    <Image
      src={logo}
      alt="Ombré"
      width={width}
      height={height}
      className={`inline-block shrink-0 object-contain ${className}`.trim()}
      priority={priority}
      sizes={`${width}px`}
    />
  );
}
