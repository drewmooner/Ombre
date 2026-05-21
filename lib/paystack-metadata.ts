/** Extract `order_id` from Paystack metadata (flat or custom_fields). */
export function metadataOrderId(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata || typeof metadata !== "object") return null;

  const direct = metadata.order_id;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const customFields = metadata.custom_fields;
  if (!Array.isArray(customFields)) return null;

  for (const field of customFields) {
    if (!field || typeof field !== "object") continue;
    const row = field as Record<string, unknown>;
    const name = row.variable_name ?? row.display_name;
    if (name !== "order_id") continue;
    const value = row.value;
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}
