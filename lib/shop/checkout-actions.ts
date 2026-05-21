"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  isAkwaIbomState,
  parseDeliveryMethod,
} from "@/lib/delivery-methods";
import { runOrderMaintenance } from "@/lib/order-maintenance";
import {
  createPendingOrder,
  expirePendingOrder,
} from "@/lib/order-store";
import type { OrderDelivery, OrderLineItem } from "@/lib/order-types";
import {
  deductProductPieces,
  findProductById,
  restoreProductPieces,
} from "@/lib/product-store";
import { getShopSettings } from "@/lib/shop-settings";
import { getShopCustomer } from "@/lib/shop-auth";
import { sendOrderAwaitingPaymentEmail } from "@/lib/email/order-emails";
import {
  isCheckoutReady,
  isCheckoutSimulateEnabled,
} from "@/lib/checkout/checkout-mode";
import { initializePaystackPayment } from "@/lib/paystack";
import type { FormActionState } from "@/lib/form-action-state";

export type CheckoutState = FormActionState;

type CheckoutLineInput = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

async function appOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  }
  return `${proto}://${host}`;
}

function parseCartLines(raw: string): CheckoutLineInput[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const lines: CheckoutLineInput[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") return null;
      const item = row as CheckoutLineInput;
      if (
        typeof item.productId !== "string" ||
        typeof item.name !== "string" ||
        typeof item.price !== "number" ||
        typeof item.quantity !== "number" ||
        item.quantity < 1
      ) {
        return null;
      }
      lines.push({
        productId: item.productId,
        slug: typeof item.slug === "string" ? item.slug : item.productId,
        name: item.name,
        price: Math.round(item.price),
        quantity: Math.round(item.quantity),
        image: typeof item.image === "string" ? item.image : "",
      });
    }
    return lines;
  } catch {
    return null;
  }
}

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

    const cartLines = parseCartLines(String(formData.get("cart") ?? ""));
    if (!cartLines) return { error: "Your bag is empty or invalid" };

    const settings = await getShopSettings();
    const orderItems: OrderLineItem[] = [];

    for (const line of cartLines) {
      const product = await findProductById(line.productId);
      if (!product) {
        return { error: `${line.name} is no longer available` };
      }
      if (!product.inStock || product.pieces < line.quantity) {
        return {
          error:
            product.pieces === 0
              ? `${product.name} is out of stock`
              : `Only ${product.pieces} left for ${product.name}`,
        };
      }
      if (product.price !== line.price) {
        return {
          error: `Price changed for ${product.name}. Refresh your bag and try again.`,
        };
      }
      orderItems.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        quantity: line.quantity,
        image: product.images[0] ?? line.image,
        size: product.sizes?.join(", "),
      });
    }

    const subtotal = orderItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );

    const reserved: OrderLineItem[] = [];

    try {
      for (const item of orderItems) {
        await deductProductPieces(item.productId, item.quantity);
        reserved.push(item);
      }
    } catch (e) {
      for (const item of reserved) {
        try {
          await restoreProductPieces(item.productId, item.quantity);
        } catch {
          /* best effort */
        }
      }
      return {
        error: e instanceof Error ? e.message : "Could not reserve stock",
      };
    }

    let order;
    try {
      const paystackReference = randomUUID();
      order = await createPendingOrder({
        customerId: customer.id,
        customerEmail: delivery.email,
        items: orderItems,
        subtotal,
        shippingFee: 0,
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
      const origin = await appOrigin();
      const completeUrl = `${origin}/checkout/complete?reference=${encodeURIComponent(ref)}`;
      const emailResult = await sendOrderAwaitingPaymentEmail(order, completeUrl);
      if (!emailResult.ok) {
        console.warn("[checkout] Order email failed:", emailResult.error);
      }

      revalidatePath("/", "layout");
      revalidatePath("/store/orders");

      return { redirectTo: completeUrl };
    }

    const origin = await appOrigin();
    const init = await initializePaystackPayment({
      email: delivery.email,
      amountKobo: order.total * 100,
      reference: ref,
      callbackUrl: `${origin}/checkout/complete?reference=${encodeURIComponent(ref)}`,
      metadata: { order_id: order.id, customer_id: customer.id },
    });

    if (!init.ok) {
      await expirePendingOrder(order);
      return { error: init.error };
    }

    const emailResult = await sendOrderAwaitingPaymentEmail(
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
