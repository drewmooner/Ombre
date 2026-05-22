import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import {
  WHATSAPP_DEFAULT_MESSAGE,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[rgba(var(--accent-rgb),0.1)] px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:mt-20 sm:px-6 sm:py-12 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:justify-between">
        <div>
          <BrandLogo size="footer" className="mb-3" />
          <p className="font-display text-2xl font-medium text-[var(--accent)]">Ombré</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
            Curated fashion wears, delivered across Nigeria.
          </p>
        </div>

        <div className="flex flex-wrap gap-8 text-sm sm:gap-12">
          <div>
            <p className="mb-3 font-medium text-[var(--foreground)]">Shop</p>
            <ul className="space-y-2 text-[var(--muted)]">
              <li>
                <Link href="/" className="link-accent transition-colors">
                  All products
                </Link>
              </li>
              <li>
                <Link href="/cart" className="link-accent transition-colors">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="link-accent transition-colors">
                  Orders
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-medium text-[var(--foreground)]">Help</p>
            <ul className="space-y-2 text-[var(--muted)]">
              <li>
                <Link href="/terms" className="link-accent transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="link-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href={buildWhatsAppUrl(WHATSAPP_DEFAULT_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-accent transition-colors"
                >
                  WhatsApp support
                </a>
              </li>
              <li>NGN · Paystack payments</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl border-t border-[rgba(var(--accent-rgb),0.08)] pt-6 sm:mt-10">
        <p className="text-center text-xs tracking-wide text-[var(--muted)] sm:text-left">
          © 2026 Ombré. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
