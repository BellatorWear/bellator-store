import { headers } from "next/headers";

/**
 * Prüft, ob eine Server Action von einer vertrauenswürdigen Quelle kommt
 * (Origin/Referer-Check, ähnlich CSRF-Schutz). Next.js Server Actions
 * prüfen das bei POST intern schon grob, aber wir wollen es explizit und
 * sichtbar für sensible Aktionen (Login, Passwort ändern, Account löschen,
 * Punkte einlösen etc.), damit klar ist welche Quellen erlaubt sind.
 */
export async function isTrustedOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("host");
  if (!host) return false;

  // Erlaubte Hosts: der eigene Host (Produktion/Preview) sowie localhost für Dev.
  const allowedHosts = [host, "localhost:3000", "127.0.0.1:3000"];

  if (!origin) {
    // Manche Browser/Direktaufrufe senden keinen Origin-Header (z.B. ältere
    // Same-Site-Navigationen). In diesem Fall verlassen wir uns auf das
    // Session-Cookie selbst (httpOnly, signiert) statt hart zu blocken.
    return true;
  }

  try {
    const originHost = new URL(origin).host;
    return allowedHosts.includes(originHost);
  } catch {
    return false;
  }
}
