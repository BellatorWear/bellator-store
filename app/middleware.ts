import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

export async function middleware(request: NextRequest) {
  // Extrahiere Client IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Prüfe Rate Limit auf Middleware Level
  try {
    const { success, remaining, reset } = await middlewareRatelimit.limit(
      `middleware:${ip}`,
    );

    if (!success) {
      // Return 429 Too Many Requests
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
    // Im Fehlerfall: strict sein
    return new NextResponse("Service temporarily unavailable", {
      status: 503,
    });
  }

  // Schütze alle Pfade, die mit /shop beginnen
  if (request.nextUrl.pathname.startsWith("/shop")) {
    const authCookie = request.cookies.get("bellator-access");

    // Wenn kein Cookie da ist, schick den User zum Login (Root)
    if (!authCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/shop/:path*", "/api/:path*"],
};
