import { db } from "@/db";
import { newsPosts } from "@/db/schema";
import { desc } from "drizzle-orm";
import InfoPageLayout from "@/app/components/InfoPageLayout";
import NewsClient from "./NewsClient";

export const metadata = { title: "News — Bellator Streetwear" };

export default async function NewsPage() {
  const posts = await db.select().from(newsPosts).orderBy(desc(newsPosts.createdAt));
  return (
    <InfoPageLayout title="News" subtitle="Updates vom Bellator-Team">
      <NewsClient posts={posts} />
    </InfoPageLayout>
  );
}
