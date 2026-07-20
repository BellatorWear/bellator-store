import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "bellator-session";
const GUEST_COOKIE = "bellator-guest";

// Nur ein leichter "Cookie vorhanden?"-Check hier (Middleware läuft in der
// Edge-Runtime, volle Session-Verifikation gegen die DB passiert wie bisher
// serverseitig in getCurrentUser()). Reicht für die Weiterleitungs-
// Entscheidung völlig aus.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const hasGuest = request.cookies.has(GUEST_COOKIE);
  if (hasSession || hasGuest) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/auth";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/shop/:path*",
    "/profil/:path*",
    "/einstellungen/:path*",
    "/admin/:path*",
    "/belege/:path*",
    "/chat/:path*",
  ],
};
