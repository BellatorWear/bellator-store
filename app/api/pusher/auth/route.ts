import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatChannelMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { getPusherServer, channelEventName, userEventName } from "@/lib/pusher";

/**
 * Pusher ruft diesen Endpoint auf, bevor ein Browser einen privaten Kanal
 * (private-chat-*) abonnieren darf. Ohne diese Prüfung könnte jeder
 * eingeloggte User einfach die Channel-ID eines fremden Chats erraten und
 * live mitlesen - Pusher selbst kennt unsere Mitgliedschafts-Regeln nicht,
 * das muss serverseitig hier passieren.
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });

  const form = await req.formData();
  const socketId = form.get("socket_id") as string | null;
  const channelName = form.get("channel_name") as string | null;
  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  // Der eigene Update-Kanal des Users (neue Channels/DMs) - Zugriff nur für
  // sich selbst.
  if (channelName === userEventName(session.userId)) {
    const pusher = getPusherServer();
    const authResponse = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  }

  // Chat-Channel: nur echte Mitglieder dürfen abonnieren.
  const match = channelName.match(/^private-chat-(\d+)$/);
  if (!match) return NextResponse.json({ error: "Unbekannter Kanal." }, { status: 400 });
  const channelId = Number(match[1]);

  const membership = await db
    .select()
    .from(chatChannelMembers)
    .where(and(eq(chatChannelMembers.channelId, channelId), eq(chatChannelMembers.userId, session.userId)));
  if (membership.length === 0) {
    return NextResponse.json({ error: "Kein Zugriff auf diesen Channel." }, { status: 403 });
  }

  const pusher = getPusherServer();
  const authResponse = pusher.authorizeChannel(socketId, channelEventName(channelId));
  return NextResponse.json(authResponse);
}
