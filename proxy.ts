import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generalRatelimit } from "@/app/utils/ratelimit";

const SESSION_COOKIE = "bellator-session";
const GUEST_COOKIE = "bellator-guest";

// Next.js 16 hat "middleware.ts" in "proxy.ts" umbenannt (nur EINE der
// beiden Dateien darf existieren, sonst bricht der Build). Diese Datei
// übernimmt deshalb ZWEI Aufgaben, die vorher in middleware.ts und
// proxy.ts getrennt waren:
//
// 1. Globales Rate-Limiting (früher middleware.ts, breiter Matcher: fast
//    jeder Request) - schützt vor Traffic-Spitzen/Missbrauch, gibt sauber
//    429 zurück statt die Seite unter Last kollabieren zu lassen.
// 2. Auth-Redirect für geschützte Bereiche (ursprünglicher proxy.ts-Zweck,
//    engerer Pfad-Kreis) - leichter Cookie-Vorhanden-Check, volle
//    Session-Verifikation gegen die DB passiert weiterhin serverseitig in
//    getCurrentUser().
//
// Ein einzelner Matcher deckt jetzt beide Fälle ab (siehe config unten);
// welcher Teil greift, wird per pathname-Check innerhalb der Funktion
// entschieden.
const PROTECTED_PATH_PREFIXES = [
  "/shop/",
  "/profil",
  "/einstellungen",
  "/admin",
  "/belege",
  "/chat",
];

function needsAuthRedirect(pathname: string): boolean {
  if (pathname === "/shop") return true;
  return PROTECTED_PATH_PREFIXES.some((prefix) =>
    prefix.endsWith("/") ? pathname.startsWith(prefix) : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  // --- 1. Globales Rate-Limit (ex-middleware.ts) ---
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
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }
  } catch (error) {
    // Upstash nicht erreichbar o.ä.: lieber durchlassen als die komplette
    // Seite lahmlegen - das globale Limit ist eine Zusatzsicherung, kein
    // primärer Schutzmechanismus (der sitzt gezielt bei Login/Chat/Codes).
    console.error("[proxy] Rate limit check fehlgeschlagen:", error);
  }

  // --- 2. Auth-Redirect für geschützte Bereiche (ex-proxy.ts) ---
  if (needsAuthRedirect(request.nextUrl.pathname)) {
    const hasSession = request.cookies.has(SESSION_COOKIE);
    const hasGuest = request.cookies.has(GUEST_COOKIE);
    if (!hasSession && !hasGuest) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Breiter Matcher (vom ex-middleware.ts übernommen) - Rate-Limiting
    // soll fast überall greifen, nicht nur in den Auth-geschützten
    // Bereichen. Ausgenommen: Next.js-interne Assets, Bildoptimierung,
    // Favicon und statische Bilddateien.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
