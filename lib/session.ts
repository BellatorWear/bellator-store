import crypto from "crypto";

/**
 * Signierte, fälschungssichere Session.
 *
 * Vorher wurde nur ein Cookie mit dem festen Wert "authorized" gesetzt und die
 * Middleware hat lediglich geprüft, ob *irgendein* Cookie mit diesem Namen
 * existiert. Das hätte sich mit einer beliebigen Browser-Konsole faken lassen
 * und enthielt außerdem keine Information darüber, WER eingeloggt ist – damit
 * konnte z.B. der Passwort-Endpunkt nicht wissen, welchen Account er ändern
 * soll.
 *
 * Jetzt wird der Cookie-Inhalt kryptographisch signiert (HMAC-SHA256) und
 * enthält die User-ID + Email. Ohne den Server-Secret kann niemand einen
 * gültigen Cookie selbst bauen.
 */

const COOKIE_NAME = "bellator-session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 Tage

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET ist nicht gesetzt oder zu kurz (mind. 32 Zeichen). " +
        "Bitte in .env.local einen zufälligen, langen Wert eintragen, z.B. mit: " +
        "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
    );
  }
  return secret;
}

export type SessionPayload = {
  userId: number;
  email: string;
  iat: number; // issued at, ms since epoch
};

function sign(payloadB64: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");
}

export function createSessionToken(userId: number, email: string): string {
  const payload: SessionPayload = { userId, email, iat: Date.now() };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined | null,
): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;

  let expectedSignature: string;
  try {
    expectedSignature = sign(payloadB64);
  } catch {
    return null;
  }

  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8"),
    ) as SessionPayload;
    if (
      typeof payload.userId !== "number" ||
      typeof payload.email !== "string" ||
      typeof payload.iat !== "number"
    ) {
      return null;
    }
    if (Date.now() - payload.iat > SESSION_MAX_AGE_MS) return null; // abgelaufen
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_COOKIE_MAX_AGE_SECONDS = SESSION_MAX_AGE_MS / 1000;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  };
}
