import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getCurrentUser } from "@/app/actions";

const STATE_COOKIE = "discord-oauth-state";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/shop/challenges?discord=not_configured", request.url));
  }

  // Zufälliger State gegen CSRF im OAuth-Flow - wird als kurzlebiger,
  // httpOnly Cookie gesetzt und beim Callback wieder abgeglichen. Ohne
  // das könnte jemand einen fremden User dazu bringen, ohne eigenes
  // Zutun einen Discord-Account eines Angreifers zu bestätigen.
  const state = crypto.randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax", // "lax" nötig, da Discord per Top-Level-Redirect zurückschickt (strict würde den Cookie dabei nicht mitschicken)
    maxAge: 600, // 10 Minuten
    path: "/",
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mz-dev.de";
  const redirectUri = `${baseUrl}/api/discord/callback`;

  const authorizeUrl = new URL("https://discord.com/api/oauth2/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "identify");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("prompt", "none");

  return NextResponse.redirect(authorizeUrl);
}
