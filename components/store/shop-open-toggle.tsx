"use client";

import { useActionState } from "react";
import { setShopOpenAction, type ActionState } from "@/lib/store/actions";

type ShopOpenToggleProps = {
  shopOpen: boolean;
};

const initial: ActionState = {};

export function ShopOpenToggle({ shopOpen }: ShopOpenToggleProps) {
  const [state, action, pending] = useActionState(setShopOpenAction, initial);
  const isOpen = state.shopOpen ?? shopOpen;

  const hint =
    state.error ??
    (pending ? "Updating…" : isOpen ? "Shop open to customers" : "Shop closed — restocking");

  return (
    <div className="store-header-shop-toggle" title={hint}>
      <form action={action} className="store-header-shop-toggle-form">
        <span
          className={`store-header-shop-label hidden md:inline ${isOpen ? "store-header-shop-label--on" : "store-header-shop-label--off"}`}
        >
          {pending ? "…" : isOpen ? "On" : "Off"}
        </span>
        <button
          type="submit"
          role="switch"
          aria-checked={isOpen}
          aria-label={
            isOpen
              ? "Shop is on. Switch off to close the storefront."
              : "Shop is off. Switch on to open the storefront."
          }
          disabled={pending}
          className={`shop-toggle ${isOpen ? "shop-toggle--on" : "shop-toggle--off"}`}
          name="shopOpen"
          value={isOpen ? "false" : "true"}
        >
          <span className="shop-toggle-track" aria-hidden>
            <span className="shop-toggle-thumb" />
          </span>
        </button>
      </form>
    </div>
  );
}
