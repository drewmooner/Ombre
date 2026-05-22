import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

function supabaseImagePattern():
  | { protocol: "https"; hostname: string; pathname: string }
  | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return undefined;
  try {
    return {
      protocol: "https",
      hostname: new URL(raw).hostname,
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return undefined;
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot,
  },
  async redirects() {
    return [
      {
        source: "/checkout/success",
        destination: "/checkout/complete",
        permanent: false,
      },
      {
        source: "/payment/complete",
        destination: "/checkout/complete",
        permanent: false,
      },
      {
        source: "/checkout/callback",
        destination: "/checkout/complete",
        permanent: false,
      },
      {
        source: "/payment/callback",
        destination: "/checkout/complete",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(supabaseImagePattern() ? [supabaseImagePattern()!] : []),
    ],
  },
};

export default nextConfig;
