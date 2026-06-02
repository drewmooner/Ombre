"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getPublicAppOrigin } from "@/lib/app-origin";
import {
  isAkwaIbomState,
  parseDeliveryMethod,
} from "@/lib/delivery-methods";
import {
  formatCartAdjustmentNotice,
  parseCartLinesForCheckout,
  resolveOrderLineItemsFromCart,
  type CartLineAdjustment,
} from "@/lib/checkout/cart-lines";
import { runOrderMaintenance } from "@/lib/order-maintenance";
import {
  createPendingOrder,
  expirePendingOrder,
} from "@/lib/order-store";
import type { OrderDelivery, OrderLineItem } from "@/lib/order-types";
import { deductProductPieces, restoreProductPieces } from "@/lib/product-store";
import { getShopSettings } from "@/lib/shop-settings";
import { getShopCustomer } from "@/lib/shop-auth";
import { sendOrderAwaitingPaymentEmailIfNeeded } from "@/lib/email/order-emails";
import {
  isCheckoutReady,
  isCheckoutSimulateEnabled,
} from "@/lib/checkout/checkout-mode";
import { initializePaystackPayment } from "@/lib/paystack";
import type { FormActionState } from "@/lib/form-action-state";

export type CheckoutState = FormActionState & {
  cartAdjustments?: CartLineAdjustment[];
  stockNotice?: string;
};

function parseDelivery(
  formData: FormData,
  accountEmail: string,
): OrderDelivery | { error: string } {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? accountEmail).trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const addressLine = String(formData.get("addressLine") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const method = parseDeliveryMethod(String(formData.get("deliveryMethod") ?? ""));

  if (!fullName) return { error: "Enter your full name" };
  if (!email || !email.includes("@")) return { error: "Enter a valid email address" };
  if (!phone || phone.length < 10) return { error: "Enter a valid phone number" };
  if (!method) return { error: "Choose door step or park delivery" };
  if (!addressLine) return { error: "Enter your delivery address" };
  if (!city) return { error: "Enter your city" };
  if (!state) return { error: "Select your state" };

  if (method === "doorstep" && !isAkwaIbomState(state)) {
    return {
      error:
        "Door step delivery is for Akwa Ibom only. Choose Park if you are outside Akwa Ibom.",
    };
  }

  return {
    fullName,
    email,
    phone,
    addressLine,
    city,
    state,
    method,
  };
}

export async function startCheckout(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  try {
    const simulate = isCheckoutSimulateEnabled();

    if (!isCheckoutReady()) {
      return {
        error:
          "Checkout is not configured. Add CHECKOUT_SIMULATE_PAYMENT=true for local testing, or add Paystack keys to .env and restart the dev server.",
      };
    }

    const customer = await getShopCustomer();
    if (!customer) {
      return { error: "Sign in to checkout", redirectTo: "/login?next=/checkout" };
    }

    await runOrderMaintenance();

    const delivery = parseDelivery(formData, customer.email);
    if ("error" in delivery) return { error: delivery.error };

    const cartLines = parseCartLinesForCheckout(
      String(formData.get("cart") ?? ""),
    );
    if (!cartLines) return { error: "Your bag is empty or invalid" };

    const { items: orderItems, adjustments } =
      await resolveOrderLineItemsFromCart(cartLines);

    if (adjustments.length > 0) {
      if (orderItems.length === 0) {
        return {
          error:
            "Everything in your bag is no longer available. Remove unavailable items or choose something else.",
          cartAdjustments: adjustments,
          stockNotice: formatCartAdjustmentNotice(adjustments),
        };
      }

      return {
        cartAdjustments: adjustments,
        stockNotice: formatCartAdjustmentNotice(adjustments),
      };
    }

    if (orderItems.length === 0) {
      return { error: "Your bag is empty or invalid" };
    }
    const settings = await getShopSettings();

    const subtotal = orderItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );
    // Delivery is confirmed after payment on WhatsApp, so we only charge for items now.
    const shippingFee = 0;

    const reserved: OrderLineItem[] = [];

    try {
      for (const item of orderItems) {
        await deductProductPieces(item.productId, item.quantity);
        reserved.push(item);
      }
    } catch {
      for (const item of reserved) {
        try {
          await restoreProductPieces(item.productId, item.quantity);
        } catch {
          /* best effort */
        }
      }

      const refreshed = await resolveOrderLineItemsFromCart(cartLines);
      if (refreshed.adjustments.length > 0) {
        if (refreshed.items.length === 0) {
          return {
            error:
              "Everything in your bag is no longer available. Remove unavailable items or choose something else.",
            cartAdjustments: refreshed.adjustments,
            stockNotice: formatCartAdjustmentNotice(refreshed.adjustments),
          };
        }
        return {
          cartAdjustments: refreshed.adjustments,
          stockNotice: formatCartAdjustmentNotice(refreshed.adjustments),
        };
      }

      return { error: "Could not reserve stock — try again in a moment" };
    }

    let order;
    try {
      const paystackReference = randomUUID();
      order = await createPendingOrder({
        customerId: customer.id,
        customerEmail: delivery.email,
        items: orderItems,
        subtotal,
        shippingFee,
        delivery,
        paymentTimeoutMinutes: settings.paymentTimeoutMinutes,
        paystackReference,
      });
    } catch (e) {
      for (const item of reserved) {
        await restoreProductPieces(item.productId, item.quantity);
      }
      throw e;
    }

    const ref = order.paystackReference!;

    if (simulate) {
      const origin = await getPublicAppOrigin();
      const completeUrl = `${origin}/checkout/complete?reference=${encodeURIComponent(ref)}`;
      // Simulated checkout redirects immediately — receipt email sends on /checkout/complete
      // (avoids back-to-back Resend calls and the wrong "complete payment" email).

      revalidatePath("/", "layout");
      revalidatePath("/store/orders");

      return { redirectTo: completeUrl };
    }

    const origin = await getPublicAppOrigin();
    const init = await initializePaystackPayment({
      email: delivery.email,
      amountKobo: order.total * 100,
      reference: ref,
      // Paystack appends reference & trxref — do not add ?reference= here (duplicates break the URL)
      callbackUrl: `${origin}/checkout/complete`,
      metadata: { order_id: order.id, customer_id: customer.id },
    });

    if (!init.ok) {
      await expirePendingOrder(order);
      return { error: init.error };
    }

    {
      const { updateOrderPaystackReference, updateOrderPaymentUrl } = await import(
        "@/lib/order-store"
      );
      if (init.reference && init.reference !== ref) {
        await updateOrderPaystackReference(order.id, init.reference);
      }
      await updateOrderPaymentUrl(order.id, init.authorizationUrl);
    }

    order = {
      ...order,
      paystackReference:
        init.reference && init.reference !== ref ? init.reference : order.paystackReference,
      paymentUrl: init.authorizationUrl,
    };

    const emailResult = await sendOrderAwaitingPaymentEmailIfNeeded(
      order,
      init.authorizationUrl,
    );
    if (!emailResult.ok) {
      console.warn("[checkout] Awaiting-payment email failed:", emailResult.error);
    }

    revalidatePath("/", "layout");
    revalidatePath("/store/orders");

    return { redirectTo: init.authorizationUrl };
  } catch (e) {
    const digest =
      e && typeof e === "object" && "digest" in e
        ? String((e as { digest?: string }).digest)
        : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw e;
    return {
      error: e instanceof Error ? e.message : "Checkout failed",
    };
  }
}
