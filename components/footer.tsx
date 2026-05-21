import Link from "next/link";
import {
  WHATSAPP_DEFAULT_MESSAGE,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[rgba(var(--accent-rgb),0.1)] px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:justify-between">
        <div>
          <p className="font-display text-2xl font-medium text-[var(--accent)]">Ombré</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
            Curated fashion wears, delivered across Nigeria.
          </p>
        </div>

        <div className="flex gap-12 text-sm">
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
            </ul>
          </div>
          <div>
            <p className="mb-3 font-medium text-[var(--foreground)]">Help</p>
            <ul className="space-y-2 text-[var(--muted)]">
              <li>Delivery: 3–7 days nationwide</li>
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
              <li>NGN payments only</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
