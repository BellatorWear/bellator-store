import type { MetadataRoute } from "next";
import { db } from "@/db";
import { products, homePosts } from "@/db/schema";
import { eq } from "drizzle-orm";

// Next.js generiert daraus automatisch /sitemap.xml. Bewusst nur
// tatsächlich existierende, aktive/veröffentlichte Inhalte - keine
// Platzhalter-URLs oder geratenen Pfaden.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mz-dev.de";

  const [activeProducts, publishedPosts] = await Promise.all([
    db.select({ slug: products.slug }).from(products).where(eq(products.active, true)),
    db.select({ id: homePosts.id, updatedAt: homePosts.updatedAt }).from(homePosts).where(eq(homePosts.published, true)),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/news`, changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/hilfe`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/mehr`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/agb`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/datenschutz`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/impressum`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const productPages: MetadataRoute.Sitemap = activeProducts.map((p) => ({
    url: `${baseUrl}/shop/produkt/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const postPages: MetadataRoute.Sitemap = publishedPosts.map((p) => ({
    url: `${baseUrl}/post/${p.id}`,
    lastModified: p.updatedAt ?? undefined,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticPages, ...productPages, ...postPages];
}
