import { writeFileSync } from "fs";

const content = `use client";

import Image from "next/image";
import Link from "next/link";
import { MorphButton } from "@/components/morph-button";
import { useCart } from "@/lib/cart-context";
import { formatNaira } from "@/lib/format-price";
import { buildWhatsAppOrderUrl } from "@/lib/whatsapp-order";

export default function CartPage() {
  const { items, subtotal, itemCount, updateQuantity, removeItem, clearCart } =
    useCart();

  if (itemCount === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-medium">Your bag is empty</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Browse our collection and add something you love.
        </p>
        <MorphButton href="/" variant="primary" className="mt-8">
          Continue shopping
        </MorphButton>
      </div>
    );
  }

  const checkoutUrl = buildWhatsAppOrderUrl(items, subtotal);

  return (
    <motionBar />
  );
}
`;

writeFileSync("app/(shop)/cart/page.tsx", content);
