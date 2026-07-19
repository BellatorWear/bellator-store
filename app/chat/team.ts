import { db } from "@/db";
import { chatChannels, chatChannelMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSetting, setSetting, TEAM_CHANNEL_ID_KEY } from "@/app/utils/settings";
import { getPusherServer, userEventName } from "@/lib/pusher";

// Holt die id des globalen "Team"-Channels, legt ihn beim allerersten
// Bedarf an (ein Channel für alle Zeit - wird über siteSettings
// referenziert statt über den Namen zu suchen, damit ein Umbenennen ihn
// nicht "verliert").
export async function getOrCreateTeamChannel(): Promise<number> {
  const existingId = await getSetting<number | null>(TEAM_CHANNEL_ID_KEY, null);
  if (existingId) {
    const rows = await db.select().from(chatChannels).where(eq(chatChannels.id, existingId));
    if (rows.length > 0) return existingId;
    // Referenzierter Channel existiert nicht mehr (z.B. manuell gelöscht) -
    // neu anlegen und Setting aktualisieren.
  }

  const [channel] = await db.insert(chatChannels).values({ type: "channel", name: "Team", createdBy: null }).returning();
  await setSetting(TEAM_CHANNEL_ID_KEY, channel.id);
  return channel.id;
}

// Wird von der Admin-Action beim Umschalten des is_team-Attributs
// aufgerufen - synchronisiert die Channel-Mitgliedschaft mit dem Attribut.
export async function syncTeamChannelMembership(userId: number, isTeam: boolean): Promise<void> {
  const teamChannelId = await getOrCreateTeamChannel();
  const existing = await db
    .select()
    .from(chatChannelMembers)
    .where(and(eq(chatChannelMembers.channelId, teamChannelId), eq(chatChannelMembers.userId, userId)));

  if (isTeam && existing.length === 0) {
    await db.insert(chatChannelMembers).values({ channelId: teamChannelId, userId });
    try {
      await getPusherServer().trigger(userEventName(userId), "new-channel", { channelId: teamChannelId });
    } catch (e) {
      console.error("Pusher-Trigger fehlgeschlagen:", e);
    }
  } else if (!isTeam && existing.length > 0) {
    await db
      .delete(chatChannelMembers)
      .where(and(eq(chatChannelMembers.channelId, teamChannelId), eq(chatChannelMembers.userId, userId)));
  }
}
