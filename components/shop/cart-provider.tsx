"use client";

import { CartProvider } from "@/lib/cart-context";
import { SlidingCartButton } from "./sliding-cart-button";

export function ShopCartProvider({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <SlidingCartButton />
    </CartProvider>
  );
}
