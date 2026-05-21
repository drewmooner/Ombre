import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminSecret } from "./app-secret";

const COOKIE_NAME = "ombre-store-session";

function expectedToken(): string {
  return createHmac("sha256", requireAdminSecret())
    .update("ombre-store")
    .digest("hex");
}

export async function createStoreSession(): Promise<void> {
  const token = expectedToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroyStoreSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isStoreAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(COOKIE_NAME)?.value;
    if (!session) return false;

    const expected = expectedToken();
    const a = Buffer.from(session);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function requireStore(): Promise<void> {
  if (!(await isStoreAuthenticated())) {
    redirect("/store/login");
  }
}

export function verifyStorePassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}
