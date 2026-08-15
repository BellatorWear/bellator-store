import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { homePosts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getFeaturedReviews } from "@/app/shop/reviews";

export const HOME_CONTENT_CACHE_TAG = "home-content";

/**
 * Cached Read für Homepage-Posts + Featured-Reviews.
 *
 * WICHTIG - warum NUR das hier gecacht wird und nicht z.B. die
 * Shop-Produktliste: Posts/Reviews ändern sich selten und haben keine
 * finanziellen Konsequenzen, wenn sie mal 60s alt sind. Der Live-
 * Lagerbestand im Shop (dropLimit/soldCount/variant.stock) dagegen MUSS
 * exakt sein - Bellator verkauft limitierte Drops, ein gecachtes "noch 3
 * Stück" könnte zu Overselling führen. Deshalb bleibt die Shop-Liste
 * bewusst ungecacht (voll dynamisch, wie bisher).
 *
 * 60s TTL als Sicherheitsnetz; die eigentliche Aktualität kommt über
 * gezieltes revalidateTag(HOME_CONTENT_CACHE_TAG, "max") bei jeder Post-
 * Änderung (siehe createHomePost/updateHomePost/deleteHomePost/
 * toggleHomePostPublished in app/admin/actions.ts) und beim automatischen
 * Veröffentlichen geplanter Posts (publishDueScheduledPosts).
 *
 * Hinweis zu "max": Next.js 16 verlangt seit Kurzem ein zweites Argument
 * bei revalidateTag() (Cache-Profil, steuert Stale-While-Revalidate-
 * Verhalten). "max" ist Vercels empfohlener Default und bedeutet: der Tag
 * wird als veraltet markiert, der NÄCHSTE Request auf diesen Tag bekommt
 * frische Daten (kein hartes sofortiges Purge über alle Clients hinweg
 * mehr, wie es bei revalidateTag() ohne zweites Argument in älteren
 * Next.js-Versionen der Fall war). Für unsere 60s-TTL-Inhalte unkritisch.
 */
export const getCachedHomeContent = unstable_cache(
  async () => {
    const [posts, featuredReviews] = await Promise.all([
      db.select().from(homePosts).where(eq(homePosts.published, true)).orderBy(desc(homePosts.createdAt)),
      getFeaturedReviews(),
    ]);
    return { posts, featuredReviews };
  },
  ["home-content"],
  { tags: [HOME_CONTENT_CACHE_TAG], revalidate: 60 },
);
