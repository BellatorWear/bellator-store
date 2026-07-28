import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser, awardChallengeByType } from "@/app/actions";

const STATE_COOKIE = "discord-oauth-state";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (errorParam) {
    return NextResponse.redirect(new URL("/shop/challenges?discord=cancelled", request.url));
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/shop/challenges?discord=invalid_state", request.url));
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!clientId || !clientSecret || !botToken || !guildId) {
    console.error("Discord-OAuth nicht vollständig konfiguriert (Client-ID/-Secret/Bot-Token/Guild-ID fehlt).");
    return NextResponse.redirect(new URL("/shop/challenges?discord=not_configured", request.url));
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mz-dev.de";
  const redirectUri = `${baseUrl}/api/discord/callback`;

  try {
    // 1) Code gegen ein Access-Token tauschen (bestätigt: dieser Discord-
    // Account gehört wirklich der Person, die gerade bei uns eingeloggt ist)
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) {
      console.error("Discord Token-Exchange fehlgeschlagen:", await tokenRes.text());
      return NextResponse.redirect(new URL("/shop/challenges?discord=error", request.url));
    }
    const tokenData = (await tokenRes.json()) as { access_token: string };

    // 2) Discord-User-ID des verbundenen Accounts abfragen
    const meRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!meRes.ok) {
      return NextResponse.redirect(new URL("/shop/challenges?discord=error", request.url));
    }
    const me = (await meRes.json()) as { id: string };

    // 3) Mit dem BOT-Token (nicht dem User-Token) prüfen, ob dieser
    // Discord-Account tatsächlich Mitglied im Server ist - das ist die
    // eigentliche Verifizierung, kein Selbst-Antippen mehr.
    const memberRes = await fetch(`https://discord.com/api/guilds/${guildId}/members/${me.id}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (memberRes.status === 404) {
      return NextResponse.redirect(new URL("/shop/challenges?discord=not_member", request.url));
    }
    if (!memberRes.ok) {
      console.error("Discord Member-Check fehlgeschlagen:", memberRes.status, await memberRes.text());
      return NextResponse.redirect(new URL("/shop/challenges?discord=error", request.url));
    }

    // Echtes, serverseitig verifiziertes Ereignis - Bot hat die
    // Mitgliedschaft bestätigt, keine Selbstauskunft.
    await awardChallengeByType(user.id, "discord_join");
    return NextResponse.redirect(new URL("/shop/challenges?discord=success", request.url));
  } catch (e) {
    console.error("Discord-OAuth-Callback fehlgeschlagen:", e);
    return NextResponse.redirect(new URL("/shop/challenges?discord=error", request.url));
  }
}
