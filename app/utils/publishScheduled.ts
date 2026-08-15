import { db } from "@/db";
import { homePosts } from "@/db/schema";
import { and, lte, eq, isNotNull } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { HOME_CONTENT_CACHE_TAG } from "@/app/utils/homeContentCache";

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
    const published = await db
      .update(homePosts)
      .set({ published: true, scheduledFor: null })
      .where(and(isNotNull(homePosts.scheduledFor), lte(homePosts.scheduledFor, new Date()), eq(homePosts.published, false)))
      .returning({ id: homePosts.id });

    // Homepage-Content-Cache (siehe app/utils/homeContentCache.ts) sofort
    // invalidieren, statt bis zu 60s auf den frisch veröffentlichten Post
    // zu warten.
    if (published.length > 0) revalidateTag(HOME_CONTENT_CACHE_TAG, "max");
  } catch (e) {
    // Darf die Seite niemals zum Absturz bringen.
    console.error("Konnte geplante Posts nicht veröffentlichen:", e);
  }
}
