import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const middlewareRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:middleware",
});

// Seiten die nur ohne Login erreichbar sind (redirect zu /shop wenn eingeloggt)
const AUTH_PAGES = ["/login", "/registrieren", "/accesskey"];

// Seiten die Login erfordern
const PROTECTED_PATHS = ["/shop", "/profil", "/einstellungen"];

export async function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  try {
    const { success, reset } = await middlewareRatelimit.limit(`middleware:${ip}`);
    if (!success) {
      return new NextResponse("Zu viele Anfragen.", {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
      });
    }
  } catch (error) {
    console.error("Rate limit error:", error);
  }

  const pathname = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get("bellator-session");
  const guestCookie = request.cookies.get("bellator-guest");
  const isLoggedIn = !!sessionCookie;
  const isGuest = !!guestCookie;
  const hasAccess = isLoggedIn || isGuest;

  // Eingeloggte User von Login-Seiten wegschicken
  if (AUTH_PAGES.some(p => pathname.startsWith(p)) && isLoggedIn) {
    return NextResponse.redirect(new URL("/shop", request.url));
  }

  // Geschützte Seiten: nur mit Session (nicht Gast für /profil, /einstellungen)
  if (pathname.startsWith("/profil") || pathname.startsWith("/einstellungen") || pathname.startsWith("/belege")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", request.url));
  }

  // Shop: Session oder Gast
  if (pathname.startsWith("/shop")) {
    if (!hasAccess) return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/shop/:path*", "/profil/:path*", "/einstellungen/:path*", "/belege/:path*", "/belege", "/login", "/registrieren", "/accesskey", "/api/:path*"],
};
