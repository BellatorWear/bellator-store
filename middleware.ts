import { NextRequest, NextResponse } from "next/server";
import { generalRatelimit } from "@/app/utils/ratelimit";

// Läuft auf der Edge, VOR jedem Seiten-/API-Request (siehe config.matcher
// unten). Ergänzt die bereits vorhandenen, gezielten Rate-Limits (Login,
// Chat, Code-Einlösung, MFA) um ein grobmaschiges, globales Limit pro IP.
//
// Zweck: bei einem Traffic-Spike (Drop-Ansturm, DDoS-artiger Bot-Traffic,
// ein kaputtes Skript das in einer Schleife pollt) soll der Server sauber
// mit 429 antworten, statt dass Datenbank/Compute in die Knie gehen und
// die Seite für alle anderen crasht oder extrem langsam wird.
//
// Bewusst großzügig (100 Requests/Minute, siehe app/utils/ratelimit.ts) -
// das greift nicht bei normalem Browsing, sondern nur bei echtem
// Missbrauch/Spitzenlast. Bei Upstash-Fehlern lässt checkGeneralRateLimit
// intern bereits "fail closed" (ablehnen) - hier zusätzlich defensiv mit
// try/catch, damit ein Fehler in der Middleware selbst nie die ganze Seite
// unerreichbar macht (dann lieber durchlassen als komplett blockieren).
export async function middleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    const { success, reset } = await generalRatelimit.limit(`edge:${ip}`);

    if (!success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte kurz warten und erneut versuchen." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
          },
        },
      );
    }
  } catch (error) {
    // Upstash nicht erreichbar o.ä.: lieber durchlassen als die komplette
    // Seite lahmlegen - das globale Limit ist eine Zusatzsicherung, kein
    // primärer Schutzmechanismus (der sitzt gezielt bei Login/Chat/Codes).
    console.error("[middleware] Rate limit check fehlgeschlagen:", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Alles außer Next.js-internen Assets, Bildoptimierung und Favicon -
    // API-Routen UND Seiten sollen gleichermaßen geschützt sein.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
