"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/product-types";
import { LockIcon } from "./icons";
import { MorphButton } from "./morph-button";

type AddToCartButtonProps = {
  product: Product;
  quantity?: number;
  fullWidth?: boolean;
  size?: "default" | "large";
};

export function AddToCartButton({
  product,
  quantity = 1,
  fullWidth,
  size = "default",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (!product.inStock) {
    return (
      <MorphButton fullWidth={fullWidth} disabled className={size === "large" ? "py-3.5" : ""}>
        <LockIcon />
        Out of stock
      </MorphButton>
    );
  }

  return (
    <MorphButton
      variant="primary"
      fullWidth={fullWidth}
      className={size === "large" ? "py-3.5 text-base" : ""}
      onClick={() => {
        addItem(product, quantity);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }}
    >
      {added ? "Added to bag" : "Add to bag"}
    </MorphButton>
  );
}
