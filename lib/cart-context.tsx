"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLineAdjustment } from "@/lib/checkout/cart-lines";
import type { Product } from "./product-types";
import { getProductDisplayName } from "./product-display-name";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  inStock: boolean;
  maxPieces: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  /** Sync bag after checkout stock re-check (matches lines by product slug). */
  applyStockAdjustments: (adjustments: CartLineAdjustment[]) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "ombre-cart";

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    if (!product.inStock || product.pieces <= 0) return;

    const maxPieces = product.pieces;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, maxPieces);
        if (nextQty < 1) return prev;
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: nextQty, maxPieces, inStock: nextQty > 0 }
            : i,
        );
      }
      const qty = Math.min(quantity, maxPieces);
      if (qty < 1) return prev;
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: getProductDisplayName(product),
          price: product.price,
          image: product.images[0],
          quantity: qty,
          inStock: true,
          maxPieces,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const max = i.maxPieces > 0 ? i.maxPieces : quantity;
        const qty = Math.min(quantity, max);
        return { ...i, quantity: qty, inStock: qty > 0 };
      }),
    );
  }, []);

  const applyStockAdjustments = useCallback(
    (adjustments: CartLineAdjustment[]) => {
      if (!adjustments.length) return;

      setItems((prev) => {
        let next = prev;
        for (const adj of adjustments) {
          if (adj.removed) {
            next = next.filter((i) => i.slug !== adj.slug);
            continue;
          }
          next = next.map((i) => {
            if (i.slug !== adj.slug) return i;
            const qty = Math.max(1, adj.availableQuantity);
            return {
              ...i,
              quantity: qty,
              maxPieces: adj.availableQuantity,
              inStock: adj.availableQuantity > 0,
            };
          });
        }
        return next;
      });
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "[]");
    }
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      applyStockAdjustments,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      applyStockAdjustments,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
