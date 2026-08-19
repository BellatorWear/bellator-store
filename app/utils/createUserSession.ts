import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session";

/** Gleiche Hash-Logik wie beim späteren Vergleich - IP nie im Klartext speichern. */
function hashIp(ip: string): string {
  const secret = process.env.SESSION_SECRET ?? "";
  return crypto.createHash("sha256").update(`${ip}:${secret}`).digest("hex");
}

/**
 * Setzt das signierte Session-Cookie UND legt die zugehörige DB-Zeile in
 * `sessions` an (v37, "Aktive Sitzungen"). Von allen drei Stellen genutzt,
 * die eine Session erzeugen können: normaler Login (app/actions.ts),
 * Email-Verifizierung (app/api/verify-email/route.ts) und
 * MFA-Login-Abschluss (app/mfa/actions.ts) - eine gemeinsame Funktion
 * statt dreifacher Duplizierung stellt sicher, dass keiner dieser Pfade
 * vergisst, die sessions-Zeile anzulegen (sonst würde getCurrentUser()
 * die frisch erstellte Session sofort wieder als ungültig behandeln, weil
 * v37 zusätzlich zum Cookie-Signatur-Check die DB-Zeile verlangt).
 */
export async function createUserSession(userId: number, email: string, sessionVersion: number): Promise<void> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const userAgent = h.get("user-agent") ?? null;

  const sessionId = crypto.randomUUID();
  await db.insert(sessions).values({
    sessionId,
    userId,
    ipHash: hashIp(ip),
    userAgent,
  });

  const token = createSessionToken(userId, email, sessionVersion, sessionId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}
