export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

// Seiten die Login erfordern (kein Gast-Zugriff)
const AUTHED_ONLY = ["/profil", "/einstellungen", "/belege", "/admin"];

// Seiten nur für nicht-eingeloggte User
const GUEST_ONLY = ["/login", "/registrieren", "/accesskey"];

// Geschützte Seiten: Session ODER Gast-Cookie
const SHOP_PATHS = ["/shop"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const sessionToken = request.cookies.get("bellator-session")?.value;
  const session = verifySessionToken(sessionToken);
  const isLoggedIn = !!session;

  const guestCookie = request.cookies.get("bellator-guest")?.value;
  const isGuest = guestCookie === "true";

  const hasAccess = isLoggedIn || isGuest;

  // Eingeloggte User von Login-Seiten wegschicken
  if (GUEST_ONLY.some(p => pathname.startsWith(p)) && isLoggedIn) {
    return NextResponse.redirect(new URL("/shop", request.url));
  }

  // Profil, Einstellungen, Belege: nur mit echtem Login
  if (AUTHED_ONLY.some(p => pathname.startsWith(p)) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Shop: Session oder Gast-Cookie reicht
  if (SHOP_PATHS.some(p => pathname.startsWith(p)) && !hasAccess) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/shop/:path*",
    "/profil/:path*",
    "/einstellungen/:path*",
    "/belege/:path*",
    "/admin/:path*",
    "/login",
    "/registrieren",
    "/accesskey",
  ],
};
