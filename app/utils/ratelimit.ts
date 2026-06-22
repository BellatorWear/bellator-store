import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// Erstelle einen Redis-Client mit Upstash Credentials
// WICHTIG: Setze diese Environment Variables in deinem .env.local:
// UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
// UPSTASH_REDIS_REST_TOKEN=xxx
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate Limiter für Login-Versuche (sehr strict gegen Brute Force)
export const loginRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 Versuche pro 15 Minuten
  analytics: true,
  prefix: "ratelimit:login",
});

// Rate Limiter für Email-Requests (gegen Spam)
export const emailRequestRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 Anfragen pro Stunde
  analytics: true,
  prefix: "ratelimit:email",
});

// Rate Limiter für allgemeine Requests
export const generalRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 Requests pro Minute
  analytics: true,
  prefix: "ratelimit:general",
});

/**
 * Extrahiert die Client IP-Adresse aus dem Request
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Prüfe Login Rate Limit
 */
export async function checkLoginRateLimit(): Promise<{
  success: boolean;
  remaining: number;
  resetAfter: number;
}> {
  const ip = await getClientIP();
  const identifier = `login:${ip}`;

  try {
    const { success, remaining, reset } =
      await loginRatelimit.limit(identifier);
    return {
      success,
      remaining: Math.max(0, remaining),
      resetAfter: reset ? Math.max(0, reset - Date.now()) : 0,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Im Fehlerfall: strict sein und ablehnen
    return { success: false, remaining: 0, resetAfter: 900000 }; // 15 Minuten
  }
}

/**
 * Prüfe Email Request Rate Limit
 */
export async function checkEmailRateLimit(
  email: string,
): Promise<{ success: boolean; remaining: number; resetAfter: number }> {
  const identifier = `email:${email.toLowerCase()}`;

  try {
    const { success, remaining, reset } =
      await emailRequestRatelimit.limit(identifier);
    return {
      success,
      remaining: Math.max(0, remaining),
      resetAfter: reset ? Math.max(0, reset - Date.now()) : 0,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return { success: false, remaining: 0, resetAfter: 3600000 }; // 1 Stunde
  }
}

/**
 * Prüfe allgemeinen Rate Limit
 */
export async function checkGeneralRateLimit(): Promise<{
  success: boolean;
  remaining: number;
  resetAfter: number;
}> {
  const ip = await getClientIP();
  const identifier = `general:${ip}`;

  try {
    const { success, remaining, reset } =
      await generalRatelimit.limit(identifier);
    return {
      success,
      remaining: Math.max(0, remaining),
      resetAfter: reset ? Math.max(0, reset - Date.now()) : 0,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return { success: false, remaining: 0, resetAfter: 60000 }; // 1 Minute
  }
}
