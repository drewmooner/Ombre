import { fulfillOrderPayment } from "@/lib/checkout/fulfill-payment";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    await fulfillOrderPayment(event.data.reference);
  }

  return Response.json({ received: true });
}
