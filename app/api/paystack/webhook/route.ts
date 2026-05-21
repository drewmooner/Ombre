import { fulfillOrderPayment } from "@/lib/checkout/fulfill-payment";
import { metadataOrderId } from "@/lib/paystack-metadata";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";

type PaystackWebhookEvent = {
  event?: string;
  data?: {
    reference?: string;
    metadata?: Record<string, unknown>;
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PaystackWebhookEvent;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    const orderIdHint = metadataOrderId(event.data.metadata) ?? undefined;
    const result = await fulfillOrderPayment(event.data.reference, {
      revalidate: true,
      metadataOrderId: orderIdHint,
    });
    if (!result.ok) {
      console.error(
        "[paystack/webhook] Could not fulfill payment:",
        result.error,
        event.data.reference,
      );
      return Response.json({ error: result.error }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
