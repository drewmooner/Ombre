import { createHmac, timingSafeEqual } from "crypto";

const PAYSTACK_API = "https://api.paystack.co";

function secretKey(): string | null {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  return key || null;
}

export function isPaystackConfigured(): boolean {
  return Boolean(secretKey());
}

export function paystackPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() || null;
}

export type InitializePaymentInput = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
};

export type InitializePaymentResult =
  | { ok: true; authorizationUrl: string; accessCode: string; reference: string }
  | { ok: false; error: string };

export async function initializePaystackPayment(
  input: InitializePaymentInput,
): Promise<InitializePaymentResult> {
  const key = secretKey();
  if (!key) {
    return { ok: false, error: "Paystack is not configured" };
  }

  const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
      currency: "NGN",
    }),
  });

  const body = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: {
      authorization_url?: string;
      access_code?: string;
      reference?: string;
    };
  } | null;

  if (!response.ok || !body?.status || !body.data?.authorization_url) {
    return {
      ok: false,
      error: body?.message ?? "Could not start Paystack payment",
    };
  }

  return {
    ok: true,
    authorizationUrl: body.data.authorization_url,
    accessCode: body.data.access_code ?? "",
    reference: body.data.reference ?? input.reference,
  };
}

export type VerifyPaymentResult =
  | {
      ok: true;
      paid: boolean;
      reference: string;
      amountKobo: number;
      metadata?: Record<string, unknown>;
    }
  | { ok: false; error: string };

export async function verifyPaystackPayment(
  reference: string,
): Promise<VerifyPaymentResult> {
  const key = secretKey();
  if (!key) {
    return { ok: false, error: "Paystack is not configured" };
  }

  const response = await fetch(
    `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    },
  );

  const body = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: {
      status?: string;
      reference?: string;
      amount?: number;
      metadata?: Record<string, unknown>;
    };
  } | null;

  if (!response.ok || !body?.status || !body.data) {
    return {
      ok: false,
      error: body?.message ?? "Could not verify payment",
    };
  }

  return {
    ok: true,
    paid: body.data.status === "success",
    reference: body.data.reference ?? reference,
    amountKobo: body.data.amount ?? 0,
    metadata: body.data.metadata,
  };
}

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const key = secretKey();
  if (!key || !signatureHeader) return false;

  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
