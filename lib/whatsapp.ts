/** International format, no + or spaces — e.g. 2348012345678 */
const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ||
  "2348000000000";

export function getWhatsAppNumber(): string {
  return WHATSAPP_NUMBER;
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_DEFAULT_MESSAGE =
  "Hi 0mbré, I have a question about your products.";

export function buildProductInquiryMessage(productName: string): string {
  return `Hi 0mbré, I have a question about ${productName}.`;
}

export function buildCartInquiryMessage(
  lines: string[],
  subtotalLabel: string,
): string {
  return [
    "Hi 0mbré, I have a question about items in my bag:",
    "",
    ...lines,
    "",
    `Subtotal: ${subtotalLabel}`,
  ].join("\n");
}

export function buildDeliveryFeeConfirmationMessage(orderId: string): string {
  return [
    "Hi 0mbré,",
    "",
    `My order ID is ${orderId}.`,
    "I've completed payment and I want to confirm my delivery fee.",
    "",
    "Please confirm the delivery fee for my order. Thank you.",
  ].join("\n");
}
