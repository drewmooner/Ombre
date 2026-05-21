import {
  WHATSAPP_DEFAULT_MESSAGE,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";

export function ShopClosed() {
  return (
    <section className="shop-closed mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
      <p className="shop-closed-eyebrow font-display text-sm font-medium tracking-wide text-[var(--accent-soft)]">
        Ombré
      </p>
      <h1 className="shop-closed-title font-display mt-3 text-3xl font-medium text-[var(--accent)] sm:text-4xl">
        We&apos;re restocking
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[var(--muted)] sm:text-lg">
        The shop is temporarily closed while we refresh our wears. Check back
        soon — we&apos;ll be ready for you shortly.
      </p>
      <p className="mt-8 text-sm text-[var(--muted)]">
        Questions?{" "}
        <a
          href={buildWhatsAppUrl(WHATSAPP_DEFAULT_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          className="link-accent font-medium"
        >
          Reach us on WhatsApp
        </a>
        .
      </p>
    </section>
  );
}
