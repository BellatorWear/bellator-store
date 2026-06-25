import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { verifySessionToken } from "@/lib/session";

// In Next.js 16 heißt diese Datei "proxy.ts" (vorher "middleware.ts") und
// MUSS im Projekt-Root liegen, also auf derselben Ebene wie der "app"-
// Ordner — nicht innerhalb von "app/". Genau das war der Bug, durch den
// /shop bisher ganz ohne Login erreichbar war: middleware.ts lag unter
// app/middleware.ts und wurde von Next.js deshalb still ignoriert.

// Middleware-level Rate Limiter für allgemeine IP-basierte Protection
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const middlewareRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 Requests pro Minute pro IP
  analytics: true,
  prefix: "ratelimit:middleware",
});

const PROTECTED_PREFIXES = ["/shop"];

export async function proxy(request: NextRequest) {
  // Extrahiere Client IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Prüfe Rate Limit auf Middleware Level
  try {
    const { success, reset } = await middlewareRatelimit.limit(
      `middleware:${ip}`,
    );

    if (!success) {
      return new NextResponse(
        "Zu viele Anfragen. Bitte versuche es später erneut.",
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(reset),
          },
        },
      );
    }
  } catch (error) {
    console.error("Middleware rate limit check failed:", error);
    return new NextResponse("Service temporarily unavailable", {
      status: 503,
    });
  }

  // Schütze /shop und /profil: gültige, signierte Session ODER Gast-Zugang.
  // Vorher wurde hier nur die Session geprüft — das Gast-Cookie aus dem
  // "Als Gast fortfahren"-Button (gesetzt in actions.ts) wurde komplett
  // ignoriert, wodurch Gäste sofort wieder zur Anmeldeseite geschickt wurden.
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (isProtected) {
    const token = request.cookies.get("bellator-session")?.value;
    const session = verifySessionToken(token);
    const isGuest = !!request.cookies.get("bellator-guest")?.value;

    if (!session && !isGuest) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      const response = NextResponse.redirect(loginUrl);
      // Ungültigen/abgelaufenen Cookie gleich mit entfernen
      response.cookies.delete("bellator-session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/shop/:path*", "/api/:path*"],
};
