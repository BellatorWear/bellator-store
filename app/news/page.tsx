import { db } from "@/db";
import { newsPosts, homePosts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import InfoPageLayout from "@/app/components/InfoPageLayout";
import NewsClient from "./NewsClient";

export const metadata = { title: "News — Bellator Streetwear" };

export default async function NewsPage() {
  const [newsletterPosts, articlePosts] = await Promise.all([
    db.select().from(newsPosts).orderBy(desc(newsPosts.createdAt)),
    // Nur veröffentlichte Startseiten-Posts - Entwürfe/geplante Posts
    // sollen hier nicht öffentlich auftauchen (siehe /post/[id] für die
    // Admin-Ausnahme über die direkte URL).
    db.select().from(homePosts).where(eq(homePosts.published, true)).orderBy(desc(homePosts.createdAt)),
  ]);

  // Beide Quellen zu einer gemeinsamen, nach Datum sortierten Liste
  // zusammenführen. Ein "type"-Feld unterscheidet, wie NewsClient jeden
  // Eintrag darstellt (Newsletter-Mail vs. Startseiten-Artikel).
  const merged = [
    ...newsletterPosts.map((p) => ({ ...p, type: "newsletter" as const })),
    ...articlePosts.map((p) => ({ ...p, type: "home" as const })),
  ].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

  return (
    <InfoPageLayout title="News" subtitle="Updates vom Bellator-Team">
      <NewsClient posts={merged} />
    </InfoPageLayout>
  );
}
