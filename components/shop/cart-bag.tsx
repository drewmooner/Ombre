"use client";

import Image from "next/image";
import Link from "next/link";
import { MorphButton } from "@/components/morph-button";
import { useCart } from "@/lib/cart-context";
import { formatNaira } from "@/lib/format-price";
import { buildCartInquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

type CartBagProps = {
  compact?: boolean;
  onContinueShopping?: () => void;
  showClearAll?: boolean;
  /** Hide “View full bag” on the dedicated cart page */
  isFullPage?: boolean;
  /** When false, checkout prompts sign-in instead of going to /checkout */
  signedIn?: boolean;
};

export function CartBag({
  compact = false,
  onContinueShopping,
  showClearAll = false,
  isFullPage = false,
  signedIn = false,
}: CartBagProps) {
  const { items, subtotal, itemCount, updateQuantity, removeItem, clearCart } =
    useCart();

  if (itemCount === 0) {
    return (
      <div className={compact ? "py-8 text-center" : "py-12 text-center"}>
        <p className="text-sm text-[var(--muted)]">Your bag is empty.</p>
        <MorphButton href="/" variant="primary" className="mt-6">
          Continue shopping
        </MorphButton>
      </div>
    );
  }

  const supportUrl = buildWhatsAppUrl(
    buildCartInquiryMessage(
      items.map(
        (i) => `• ${i.name} × ${i.quantity} — ${formatNaira(i.price * i.quantity)}`,
      ),
      formatNaira(subtotal),
    ),
  );

  const thumbClass = compact
    ? "relative h-20 w-16 shrink-0 overflow-hidden rounded-xl"
    : "relative h-24 w-20 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-24";

  return (
    <>
      {showClearAll && (
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={clearCart}
            className="text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <ul className={compact ? "space-y-3" : "space-y-4"}>
        {items.map((item) => (
          <li
            key={item.productId}
            className={`morph-surface flex gap-3 rounded-2xl p-3 ${compact ? "" : "gap-4 p-4 sm:gap-5 sm:p-5"}`}
          >
            <Link
              href={`/product/${item.slug}`}
              className={thumbClass}
              onClick={onContinueShopping}
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <Link
                  href={`/product/${item.slug}`}
                  className="font-medium leading-snug hover:underline"
                  onClick={onContinueShopping}
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-sm font-semibold">
                  {formatNaira(item.price)}
                  {!compact ? (
                    <span className="text-[var(--muted)] sm:hidden">
                      {" "}
                      · {formatNaira(item.price * item.quantity)} total
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 sm:mt-3 sm:gap-3">
                <div className="morph-btn flex items-center rounded-full">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="flex h-8 w-8 items-center justify-center text-lg sm:h-9 sm:w-9"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="min-w-[2ch] text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.maxPieces}
                    className="flex h-8 w-8 items-center justify-center text-lg disabled:opacity-40 sm:h-9 sm:w-9"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  Remove
                </button>
              </div>
            </div>
            {!compact && (
              <p className="hidden shrink-0 self-start text-sm font-semibold sm:block">
                {formatNaira(item.price * item.quantity)}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className={`morph-surface rounded-2xl p-5 ${compact ? "mt-4" : "mt-8 p-6"}`}>
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Subtotal</span>
          <span>{formatNaira(subtotal)}</span>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Delivery details at checkout · Nigeria only
        </p>

        {!signedIn ? (
          <div
            className="mt-5 rounded-xl border border-[rgba(var(--accent-rgb),0.22)] bg-[rgba(var(--accent-rgb),0.06)] px-4 py-3 text-sm leading-relaxed text-[var(--foreground)]"
            role="status"
          >
            <strong className="font-semibold">Sign in required.</strong> Create an
            account with your email to place orders and track delivery.
          </div>
        ) : null}

        <MorphButton
          href={signedIn ? "/checkout" : "/login?next=/checkout"}
          variant="primary"
          fullWidth
          className="mt-5 py-3 sm:mt-6 sm:py-3.5"
        >
          {signedIn ? "Proceed to checkout" : "Sign in to checkout"}
        </MorphButton>

        <MorphButton href={supportUrl} fullWidth className="mt-3">
          Questions? Chat on WhatsApp
        </MorphButton>

        {!isFullPage && (
          <MorphButton href="/cart" fullWidth className="mt-3">
            View full bag
          </MorphButton>
        )}

        <MorphButton href="/" fullWidth className="mt-3">
          Continue shopping
        </MorphButton>
      </div>
    </>
  );
}
