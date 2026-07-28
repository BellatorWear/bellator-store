import crypto from "crypto";

// Gleiche Idee wie die signierten Session-Tokens (lib/session.ts), nur für
// einen anderen Zweck - deshalb ein eigenes HMAC mit Domain-Trennung
// ("unsubscribe:"-Präfix in der signierten Nachricht), damit so ein Token
// nicht versehentlich für etwas anderes wiederverwendet werden könnte.
// Deterministisch aus der Email abgeleitet, keine DB-Tabelle nötig - der
// Link bleibt gültig, bis sich SESSION_SECRET ändert.
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET ist nicht gesetzt oder zu kurz (mind. 32 Zeichen).");
  }
  return secret;
}

export function createUnsubscribeToken(email: string): string {
  return crypto.createHmac("sha256", getSecret()).update(`unsubscribe:${email.trim().toLowerCase()}`).digest("base64url");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = createUnsubscribeToken(email);
  const a = Buffer.from(expected);
  const b = Buffer.from(token || "");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
