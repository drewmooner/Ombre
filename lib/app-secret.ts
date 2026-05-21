const DEV_FALLBACK_SECRET = "ombre-local-dev-session-secret";

let warnedMissingSecret = false;

/** Session signing secret — set ADMIN_SECRET in .env (required in production). */
export function requireAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "development") {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true;
      console.warn(
        "[env] ADMIN_SECRET is missing — using a local dev fallback. Add ADMIN_SECRET to .env and restart the dev server.",
      );
    }
    return DEV_FALLBACK_SECRET;
  }

  throw new Error(
    "ADMIN_SECRET is not set. Add ADMIN_SECRET to your .env file and restart the server.",
  );
}
