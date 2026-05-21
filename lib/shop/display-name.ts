/** First name for greetings, derived from the email local part. */
export function firstNameFromEmail(email: string): string {
  const local = (email.split("@")[0] ?? "").trim();
  const segment = local.split(/[._-]/)[0] ?? "";
  const letters = segment.replace(/[^a-zA-Z]/g, "");

  if (!letters) return "there";

  const trimmed = letters.length > 12 ? letters.slice(0, 10) : letters;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
