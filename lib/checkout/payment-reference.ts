/** First value when Paystack duplicates `reference` / `trxref` query params. */
export function paymentReferenceFromSearchParams(params: {
  reference?: string | string[];
  trxref?: string | string[];
}): string | null {
  const ref = firstQueryValue(params.reference);
  const trx = firstQueryValue(params.trxref);
  return ref || trx;
}

function firstQueryValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed || null;
}
