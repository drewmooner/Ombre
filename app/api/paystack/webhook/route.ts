import { fulfillOrderPayment } from "@/lib/checkout/fulfill-payment";
import { metadataOrderId } from "@/lib/paystack-metadata";
import { getClientIpFromRequest } from "@/lib/security/client-ip";
import { rateLimitResponse } from "@/lib/security/rate-limit-response";
import { parsePaystackWebhookBody } from "@/lib/security/validators";
import { isPaystackConfigured, verifyPaystackWebhookSignature } from "@/lib/paystack";

export async function POST(request: Request) {
  const limited = rateLimitResponse(
    "api-paystack-webhook",
    getClientIpFromRequest(request),
    { max: 120, windowMs: 60_000 },
  );
  if (limited) return limited;

  if (!isPaystackConfigured()) {
    return Response.json({ error: "Paystack not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    console.warn("[paystack/webhook] Rejected: invalid or missing signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsed = parsePaystackWebhookBody(rawBody);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const event = parsed.payload;
  if (event.event !== "charge.success" || !event.data?.reference) {
    return Response.json({ received: true, ignored: true });
  }

  const reference = event.data.reference.trim();
  const orderIdHint = metadataOrderId(event.data.metadata) ?? undefined;

  const result = await fulfillOrderPayment(reference, {
    revalidate: true,
    metadataOrderId: orderIdHint,
    forcePaystackVerify: true,
  });

  if (!result.ok) {
    console.error(
      "[paystack/webhook] Fulfillment failed:",
      result.error,
      reference,
    );
    return Response.json({ error: result.error }, { status: 500 });
  }

  if (result.alreadyPaid) {
    console.info(
      "[paystack/webhook] Duplicate notification ignored (already paid):",
      reference,
    );
    return Response.json({ received: true, duplicate: true });
  }

  console.info("[paystack/webhook] Order marked paid:", result.orderId);
  return Response.json({ received: true });
}
