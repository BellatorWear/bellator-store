import { db } from "@/db";
import { homePosts } from "@/db/schema";
import { and, lte, eq, isNotNull } from "drizzle-orm";

/**
 * Kein eigener Cron-Job nötig: wird vor dem Anzeigen der Startseite (und
 * überall sonst, wo home_posts gelesen werden) aufgerufen und schaltet
 * fällige geplante Posts scharf. Läuft dadurch effektiv beim nächsten
 * Seitenbesuch nach dem geplanten Zeitpunkt - für einen Shop mit
 * regelmäßigem Traffic in der Praxis quasi in Echtzeit. Für eine exakte,
 * besuchsunabhängige Zeitschaltung müsste zusätzlich ein Vercel Cron Job
 * eingerichtet werden (auf Hobby-Plan nur täglich möglich).
 */
export async function publishDueScheduledPosts() {
  try {
    await db
      .update(homePosts)
      .set({ published: true, scheduledFor: null })
      .where(and(isNotNull(homePosts.scheduledFor), lte(homePosts.scheduledFor, new Date()), eq(homePosts.published, false)));
  } catch (e) {
    // Darf die Seite niemals zum Absturz bringen.
    console.error("Konnte geplante Posts nicht veröffentlichen:", e);
  }
}
