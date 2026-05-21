import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { requireAdminSecret } from "./app-secret";
import type { ShopCustomer } from "./shop-types";
import { findShopUserById } from "./shop-user-store";

const COOKIE_NAME = "ombre-shop-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 400; // ~400 days

function signToken(userId: string): string {
  return createHmac("sha256", requireAdminSecret())
    .update(`ombre-shop:${userId}`)
    .digest("hex");
}

function parseToken(token: string): string | null {
  const [userId, sig] = token.split(".");
  if (!userId || !sig) return null;
  const expected = signToken(userId);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function createShopSession(userId: string): Promise<void> {
  const token = `${userId}.${signToken(userId)}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroyShopSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getShopCustomer(): Promise<ShopCustomer | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const userId = parseToken(token);
    if (!userId) return null;
    return findShopUserById(userId);
  } catch {
    return null;
  }
}
