import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";

const SESSION_COOKIE_NAME = "bellator-session";
export const CART_COOKIE_NAME = "bellator-cart-id";

/**
 * Liefert den Schlüssel unter dem der Warenkorb in der DB gespeichert ist.
 * Eingeloggte User: "user:<id>" (eindeutig, dauerhaft).
 * Gäste: "guest:<uuid>" - wird nur gelesen, nie gesetzt.
 * Das Setzen passiert in der initCart Server Action.
 */
export async function getCartOwnerKey(): Promise<string> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);
  if (session) return `user:${session.userId}`;

  const cartId = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (cartId) return `guest:${cartId}`;

  // Kein Cookie vorhanden - temporärer Key, wird nicht persistiert
  // initCart() muss zuerst aufgerufen werden um einen dauerhaften Key zu setzen
  return `guest:temp-${Date.now()}`;
}

/**
 * Setzt den Cart-Cookie - darf nur aus einer Server Action aufgerufen werden.
 */
export async function initCartCookie(): Promise<string> {
  const { default: crypto } = await import("crypto");
  const cookieStore = await cookies();
  
  // Schon eingeloggt?
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);
  if (session) return `user:${session.userId}`;

  // Schon ein Cart-Cookie?
  let cartId = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (cartId) return `guest:${cartId}`;

  // Neu erstellen
  cartId = crypto.randomUUID();
  cookieStore.set(CART_COOKIE_NAME, cartId, {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "strict",
  });
  return `guest:${cartId}`;
}
