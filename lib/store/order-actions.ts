"use server";

import { revalidatePath } from "next/cache";
import { markOrderDelivered } from "@/lib/order-store";
import { runOrderMaintenance } from "@/lib/order-maintenance";
import type { FormActionState } from "@/lib/form-action-state";

export type OrderActionState = FormActionState;

async function requireStoreAction(): Promise<void> {
  const { isStoreAuthenticated } = await import("@/lib/store-auth");
  if (!(await isStoreAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

function revalidateOrderPaths() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/store/orders");
  revalidatePath("/account/orders");
}

function actionFailure(e: unknown, fallback: string): OrderActionState {
  const digest =
    e && typeof e === "object" && "digest" in e
      ? String((e as { digest?: string }).digest)
      : "";
  if (digest.startsWith("NEXT_REDIRECT")) throw e;
  return { error: e instanceof Error ? e.message : fallback };
}

export async function markOrderDeliveredAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  try {
    await requireStoreAction();
    await runOrderMaintenance();
    const orderId = String(formData.get("orderId") ?? "").trim();
    if (!orderId) return { error: "Order not found" };
    await markOrderDelivered(orderId);
    revalidateOrderPaths();
    return { success: "Order marked as delivered — customer can see it in history" };
  } catch (e) {
    return actionFailure(e, "Could not update order");
  }
}
