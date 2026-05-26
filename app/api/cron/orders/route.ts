import { revalidatePath } from "next/cache";
import { sendDueOrderEmails } from "@/lib/order-email-jobs";
import { envVar } from "@/lib/env";
import { expireDuePendingOrders } from "@/lib/order-store";

function isAuthorizedCronRequest(request: Request, secret: string): boolean {
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  const secret = envVar("CRON_SECRET");
  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (!isAuthorizedCronRequest(request, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expiredOrders = await expireDuePendingOrders();
    const { remindersSent, expiryEmailsSent } = await sendDueOrderEmails();

    if (expiredOrders.length > 0) {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/orders");
      revalidatePath("/account/orders");
      revalidatePath("/store/orders");
    }

    return Response.json({
      ok: true,
      remindersSent,
      expiredOrders: expiredOrders.length,
      expiryEmailsSent,
    });
  } catch (error) {
    console.error("[cron/orders] Failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not process order emails",
      },
      { status: 500 },
    );
  }
}
