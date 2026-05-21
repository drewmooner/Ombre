import { expireDuePendingOrders } from "@/lib/order-store";

/** Release stock for unpaid orders past their payment window */
export async function runOrderMaintenance(): Promise<void> {
  await expireDuePendingOrders();
}
