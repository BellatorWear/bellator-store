import { db } from "@/db";
import { homePosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import InfoPageLayout from "@/app/components/InfoPageLayout";
import { getCurrentUser } from "@/app/actions";

const CATEGORY_LABELS: Record<string, string> = {
  article: "Artikel",
  video: "Video",
  leak: "Leak",
  makingof: "Making Of",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) return { title: "Post — Bellator Streetwear" };

  const found = await db.select().from(homePosts).where(eq(homePosts.id, postId));
  if (found.length === 0) return { title: "Post — Bellator Streetwear" };
  return { title: `${found[0].title} — Bellator Streetwear` };
}

export default async function HomePostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  const [found, user] = await Promise.all([
    db.select().from(homePosts).where(eq(homePosts.id, postId)),
    getCurrentUser(),
  ]);
  const isAdmin = !!user?.isAdmin;

  // Unveröffentlichte (Entwürfe/geplante) Posts sind nur für Admins über die
  // direkte URL einsehbar - genau wie beim analogen Muster bei Produkten.
  if (found.length === 0 || (!found[0].published && !isAdmin)) notFound();
  const post = found[0];

  const contentHtml = post.bodyHtml?.trim()
    ? post.bodyHtml
    : post.body
      ? `<p style="line-height:1.6; white-space:pre-wrap;">${post.body}</p>`
      : "";

  return (
    <InfoPageLayout>
      <div className="max-w-3xl mx-auto">
        <Link href="/news" className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition inline-block mb-6">
          ← Zurück zur Übersicht
        </Link>

        {!post.published && (
          <div className="mb-6 border border-yellow-700 bg-yellow-900/20 px-4 py-2 text-[10px] uppercase tracking-widest text-yellow-500">
            Entwurf — nur für dich als Admin sichtbar
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <span className="text-[9px] uppercase tracking-widest text-zinc-500 border border-zinc-700 px-2 py-0.5">
            {CATEGORY_LABELS[post.category ?? "article"] ?? post.category}
          </span>
          <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
            {new Date(post.createdAt ?? Date.now()).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white mb-6">{post.title}</h1>

        {post.imageUrl && (
          <div className="w-full mb-8 border border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageUrl} alt={post.title} className="w-full h-auto object-cover" />
          </div>
        )}

        {post.videoUrl && (
          <div className="w-full aspect-video mb-8 border border-zinc-800">
            <iframe src={post.videoUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
          </div>
        )}

        {contentHtml && (
          <div
            className="prose-invert text-sm text-zinc-300 leading-relaxed [&_a]:text-white [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_h2]:text-xl [&_h2]:font-black [&_h2]:uppercase [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-4"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        )}

        {post.attachments && post.attachments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Anhänge</p>
            <div className="space-y-2">
              {post.attachments.map((a) => (
                <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
                  className="block text-xs text-zinc-400 hover:text-white transition">
                  📎 {a.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </InfoPageLayout>
  );
}
