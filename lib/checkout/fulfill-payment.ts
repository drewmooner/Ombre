import { revalidatePath } from "next/cache";
import { isCheckoutSimulateEnabled } from "@/lib/checkout/checkout-mode";
import { sendPaymentReceiptIfNeeded } from "@/lib/email/order-emails";
import {
  confirmOrderPayment,
  findOrderById,
  findOrderByPaystackReference,
} from "@/lib/order-store";
import { metadataOrderId } from "@/lib/paystack-metadata";
import { verifyPaystackPayment } from "@/lib/paystack";

export type FulfillPaymentResult =
  | { ok: true; orderId: string; alreadyPaid: boolean }
  | { ok: false; error: string };

export type FulfillPaymentOptions = {
  /**
   * When false, skip cache revalidation (required for /checkout/complete page render).
   * Use true in Server Actions and Route Handlers only.
   */
  revalidate?: boolean;
  /** From Paystack webhook payload when verify-by-URL reference alone fails. */
  metadataOrderId?: string;
  /** Skip Resend receipt on this request (e.g. complete page — webhook sends it). */
  skipReceiptEmail?: boolean;
};

export function revalidateAfterPayment() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/store/orders");
  revalidatePath("/orders");
  revalidatePath("/account/orders");
}

function maybeRevalidateAfterPayment(options?: FulfillPaymentOptions) {
  if (options?.revalidate === false) return;
  revalidateAfterPayment();
}

async function confirmAndSendReceipt(
  orderId: string,
  paystackReference: string,
  options?: FulfillPaymentOptions,
): Promise<FulfillPaymentResult> {
  const { order: paidOrder, alreadyPaid } = await confirmOrderPayment(
    orderId,
    paystackReference,
  );

  if (!options?.skipReceiptEmail) {
    const emailResult = await sendPaymentReceiptIfNeeded(paidOrder.id);
    if (!emailResult.ok) {
      console.error("[checkout] Payment receipt email failed:", emailResult.error);
    } else if (!("skipped" in emailResult && emailResult.skipped)) {
      console.info("[checkout] Payment receipt email sent for order", paidOrder.id);
    }
  }

  maybeRevalidateAfterPayment(options);
  return { ok: true, orderId: paidOrder.id, alreadyPaid };
}

/** Local test payment — no Paystack API or webhook. Requires CHECKOUT_SIMULATE_PAYMENT. */
export async function fulfillOrderPaymentSimulated(
  reference: string,
  options?: FulfillPaymentOptions,
): Promise<FulfillPaymentResult> {
  if (!isCheckoutSimulateEnabled()) {
    return { ok: false, error: "Payment simulation is not enabled" };
  }

  const order =
    (await findOrderByPaystackReference(reference)) ??
    (await findOrderById(reference));

  if (!order) {
    return { ok: false, error: "Order not found" };
  }

  if (order.status === "expired") {
    return { ok: false, error: "This order has expired" };
  }

  if (order.status === "paid" || order.status === "delivered") {
    await sendPaymentReceiptIfNeeded(order.id);
    maybeRevalidateAfterPayment(options);
    return { ok: true, orderId: order.id, alreadyPaid: true };
  }

  try {
    return await confirmAndSendReceipt(
      order.id,
      order.paystackReference ?? reference,
      options,
    );
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not confirm simulated payment",
    };
  }
}

export async function fulfillOrderPayment(
  reference: string,
  options?: FulfillPaymentOptions,
): Promise<FulfillPaymentResult> {
  try {
    if (isCheckoutSimulateEnabled()) {
      return await fulfillOrderPaymentSimulated(reference, options);
    }

    const hintedOrderId = options?.metadataOrderId?.trim() || null;
    let verifyRef = reference.trim();
    if (hintedOrderId) {
      const hinted = await findOrderById(hintedOrderId);
      if (hinted?.paystackReference) {
        verifyRef = hinted.paystackReference;
      }
    }

    const verified = await verifyPaystackPayment(verifyRef);
    if (!verified.ok) {
      return { ok: false, error: verified.error };
    }
    if (!verified.paid) {
      return { ok: false, error: "Payment was not successful" };
    }

    const paystackRef = verified.reference || verifyRef;

    let order =
      (await findOrderByPaystackReference(paystackRef)) ??
      (await findOrderByPaystackReference(reference)) ??
      (await findOrderByPaystackReference(verifyRef)) ??
      (await findOrderById(reference));

    const metaOrderId =
      metadataOrderId(verified.metadata) ?? hintedOrderId;
    if (!order && metaOrderId) {
      order = await findOrderById(metaOrderId);
    }

    if (!order) {
      return { ok: false, error: "Order not found for this payment" };
    }

    if (verified.amountKobo !== order.total * 100) {
      return { ok: false, error: "Payment amount does not match order total" };
    }

    if (order.status === "paid" || order.status === "delivered") {
      await sendPaymentReceiptIfNeeded(order.id);
      maybeRevalidateAfterPayment(options);
      return { ok: true, orderId: order.id, alreadyPaid: true };
    }

    return await confirmAndSendReceipt(order.id, paystackRef, options);
  } catch (e) {
    console.error("[checkout] fulfillOrderPayment failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not confirm payment",
    };
  }
}
