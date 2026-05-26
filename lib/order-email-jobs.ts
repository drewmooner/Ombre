import {
  sendOrderExpiredEmailIfNeeded,
  sendOrderPaymentReminderEmailIfNeeded,
} from "@/lib/email/order-emails";
import { listOrders } from "@/lib/order-store";

const REMINDER_WINDOW_MS = 15 * 60_000;

export type OrderEmailJobSummary = {
  remindersSent: number;
  expiryEmailsSent: number;
};

export async function sendDueOrderEmails(
  now = Date.now(),
): Promise<OrderEmailJobSummary> {
  const orders = await listOrders();
  let remindersSent = 0;
  let expiryEmailsSent = 0;

  for (const order of orders) {
    if (
      order.status === "pending" &&
      order.paymentUrl &&
      !order.paymentReminderEmailSentAt
    ) {
      const msUntilExpiry = new Date(order.expiresAt).getTime() - now;
      if (msUntilExpiry > 0 && msUntilExpiry <= REMINDER_WINDOW_MS) {
        const result = await sendOrderPaymentReminderEmailIfNeeded(order);
        if (result.ok && !("skipped" in result)) {
          remindersSent += 1;
        } else if (!result.ok) {
          console.error(
            `[email] Payment reminder failed for ${order.customerEmail} (${order.id.slice(0, 8)}):`,
            result.error,
          );
        }
      }
    }

    if (order.status === "expired" && !order.expiredEmailSentAt) {
      const result = await sendOrderExpiredEmailIfNeeded(order);
      if (result.ok && !("skipped" in result)) {
        expiryEmailsSent += 1;
      } else if (!result.ok) {
        console.error(
          `[email] Expiry email failed for ${order.customerEmail} (${order.id.slice(0, 8)}):`,
          result.error,
        );
      }
    }
  }

  return { remindersSent, expiryEmailsSent };
}
