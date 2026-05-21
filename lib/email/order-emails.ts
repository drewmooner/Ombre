import type { Order } from "@/lib/order-types";
import { deliveryMethodLabel } from "@/lib/delivery-methods";
import { formatNaira } from "@/lib/format-price";
import { formatOrderDate } from "@/lib/format-date";
import {
  markReceiptEmailSent,
  findOrderById,
} from "@/lib/order-store";
import { emailBrandLogoHtml } from "@/lib/brand-logo";
import { sendEmail, type SendEmailResult } from "@/lib/email/send-email";

function orderRecipientEmail(order: Order): string {
  return (order.delivery.email || order.customerEmail).trim().toLowerCase();
}

function orderItemsHtml(order: Order): string {
  return order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;font-family:system-ui,sans-serif;font-size:14px;color:#2a2224;">
          ${item.name}${item.size ? ` · ${item.size}` : ""} × ${item.quantity}
        </td>
        <td align="right" style="padding:8px 0;font-family:system-ui,sans-serif;font-size:14px;color:#2a2224;">
          ${formatNaira(item.price * item.quantity)}
        </td>
      </tr>`,
    )
    .join("");
}

function orderTotalsHtml(order: Order): string {
  return `
    <tr><td style="padding:8px 0 0;font-weight:600;color:#2a2224;font-size:14px;">Total</td><td align="right" style="padding:8px 0 0;font-weight:600;color:#722f37;font-size:15px;">${formatNaira(order.total)}</td></tr>`;
}

function deliveryHtml(order: Order): string {
  const d = order.delivery;
  const method = deliveryMethodLabel(d.method);
  const email = d.email || order.customerEmail;
  return `
    <p style="margin:0 0 4px;font-family:system-ui,sans-serif;font-size:14px;color:#2a2224;"><strong>${d.fullName}</strong></p>
    <p style="margin:0 0 4px;font-family:system-ui,sans-serif;font-size:13px;color:#73666a;">${email}</p>
    <p style="margin:0 0 4px;font-family:system-ui,sans-serif;font-size:13px;color:#73666a;">${d.phone}</p>
    <p style="margin:0 0 8px;font-family:system-ui,sans-serif;font-size:13px;color:#73666a;">
      <strong style="color:#2a2224;">${method}</strong>
    </p>
    <p style="margin:0;font-family:system-ui,sans-serif;font-size:13px;color:#73666a;line-height:1.5;">
      ${d.addressLine}<br />${d.city}, ${d.state}
    </p>`;
}

function emailShell(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background-color:#f3eeec;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3eeec;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#fffbf9;border:1px solid rgba(114,47,55,0.12);border-radius:16px;">
        <tr><td style="padding:24px 28px 8px;text-align:center;border-bottom:1px solid rgba(114,47,55,0.08);">
          ${emailBrandLogoHtml()}
          <p style="margin:6px 0 0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#9a5a63;">${title}</p>
        </td></tr>
        <tr><td style="padding:24px 28px;">${bodyHtml}</td></tr>
        <tr><td style="padding:16px 28px 24px;background:rgba(114,47,55,0.04);text-align:center;border-top:1px solid rgba(114,47,55,0.08);">
          <p style="margin:0;font-size:12px;color:#9a5a63;">Ombré · Curated fashion wears · Nigeria</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export async function sendOrderAwaitingPaymentEmail(
  order: Order,
  paymentUrl: string,
) {
  const expires = formatOrderDate(order.expiresAt);
  const method = deliveryMethodLabel(order.delivery.method);
  const subject = `Complete your Ombré order — ${formatNaira(order.total)}`;
  const text = [
    "Hi,",
    "",
    "Your order is reserved while you complete payment.",
    "",
    `Total: ${formatNaira(order.total)} (pay by ${expires})`,
    `Delivery: ${method}`,
    "",
    `Pay here: ${paymentUrl}`,
    "",
    "If payment isn't received in time, items return to the shop for other customers.",
    "",
    "— Ombré",
  ].join("\n");

  const html = emailShell(
    "Complete payment",
    `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#73666a;">
      Your bag is reserved. Complete Paystack payment before <strong style="color:#2a2224;">${expires}</strong> or the items go back on sale.
    </p>
    <table width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">${orderItemsHtml(order)}</table>
    <table width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;border-top:1px solid rgba(114,47,55,0.1);padding-top:12px;">${orderTotalsHtml(order)}</table>
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#9a5a63;">Delivery</p>
    ${deliveryHtml(order)}
    <p style="margin:24px 0 0;text-align:center;">
      <a href="${paymentUrl}" style="display:inline-block;padding:14px 28px;background:#722f37;color:#fffbf9;text-decoration:none;border-radius:9999px;font-size:14px;font-weight:600;">Pay with Paystack</a>
    </p>`,
  );

  return sendEmail({ to: orderRecipientEmail(order), subject, html, text });
}

export async function sendOrderPaymentReceivedEmail(order: Order) {
  const method = deliveryMethodLabel(order.delivery.method);
  const subject = `Payment received — Ombré order ${formatNaira(order.total)}`;
  const text = [
    "Thank you!",
    "",
    `We've received your payment of ${formatNaira(order.total)}.`,
    "",
    "We're preparing your order for delivery across Nigeria.",
    "",
    "Items:",
    ...order.items.map(
      (i) =>
        `• ${i.name} × ${i.quantity} — ${formatNaira(i.price * i.quantity)}`,
    ),
    "",
    `Delivery (${method}): ${order.delivery.fullName}, ${order.delivery.email || order.customerEmail}, ${order.delivery.addressLine}, ${order.delivery.city}, ${order.delivery.state}`,
    "",
    "— Ombré",
  ].join("\n");

  const html = emailShell(
    "Payment received",
    `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#73666a;">
      Thank you — your payment of <strong style="color:#722f37;">${formatNaira(order.total)}</strong> is confirmed. We'll prepare your order for delivery.
    </p>
    <table width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">${orderItemsHtml(order)}</table>
    <table width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;border-top:1px solid rgba(114,47,55,0.1);padding-top:12px;">${orderTotalsHtml(order)}</table>
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#9a5a63;">Delivery to</p>
    ${deliveryHtml(order)}`,
  );

  return sendEmail({ to: orderRecipientEmail(order), subject, html, text });
}

export type PaymentReceiptEmailResult =
  | SendEmailResult
  | { ok: true; skipped: true };

/** Sends payment confirmation once per order (safe to call from complete page + webhook). */
export async function sendPaymentReceiptIfNeeded(
  orderId: string,
): Promise<PaymentReceiptEmailResult> {
  const order = await findOrderById(orderId);
  if (!order) {
    return { ok: false, error: "Order not found" };
  }
  if (order.status !== "paid" && order.status !== "delivered") {
    return { ok: false, error: "Order is not paid" };
  }
  if (order.receiptEmailSentAt) {
    return { ok: true, skipped: true };
  }

  const result = await sendOrderPaymentReceivedEmail(order);
  if (result.ok) {
    await markReceiptEmailSent(order.id);
    console.info(
      `[email] Payment receipt sent to ${orderRecipientEmail(order)} (order ${order.id.slice(0, 8)})`,
    );
  } else {
    console.error(
      `[email] Payment receipt failed for ${orderRecipientEmail(order)}:`,
      result.error,
    );
  }
  return result;
}
