/** Read env vars with trim and optional surrounding quotes stripped. */
export function envVar(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim() || undefined;
  }
  return raw;
}

export function requireEnvVar(name: string): string {
  const value = envVar(name);
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env and restart the dev server.`);
  }
  return value;
}
