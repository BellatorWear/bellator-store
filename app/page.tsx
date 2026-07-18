import { db } from "@/db";
import { homePosts, users, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import GlobalHeader from "./components/GlobalHeader";
import GlobalFooter from "./components/GlobalFooter";
import LandingSound from "./components/LandingSound";
import PageViewTracker from "./PageViewTracker";
import { publishDueScheduledPosts } from "./utils/publishScheduled";
import CountdownBanner from "./shop/components/CountdownBanner";
import { getSetting, COUNTDOWN_KEY, COUNTDOWN_DEFAULT } from "@/app/utils/settings";
import { getCurrentUser } from "@/app/actions";

export const metadata = { title: "Bellator Streetwear — Home" };

const CATEGORY_LABELS: Record<string, string> = {
  article: "Artikel",
  video: "Video",
  leak: "Leak",
  makingof: "Making Of",
};

export default async function HomePage() {
  await publishDueScheduledPosts();
  const user = await getCurrentUser();
  const [posts, userCountResult, countdownSetting, upcomingDrops] = await Promise.all([
    db.select().from(homePosts).where(eq(homePosts.published, true)).orderBy(desc(homePosts.createdAt)),
    db.select({ id: users.id }).from(users),
    getSetting(COUNTDOWN_KEY, COUNTDOWN_DEFAULT),
    db.select({ dropDate: products.dropDate }).from(products),
  ]);

  const userCount = userCountResult.length;

  // Gleiche Fallback-Logik wie im Shop: wenn kein manueller Countdown aktiv
  // ist, automatisch auf den nächsten anstehenden Drop-Termin zeigen.
  let countdown = countdownSetting;
  if (!countdown.enabled) {
    const now = Date.now();
    const nextDrop = upcomingDrops
      .map((p) => p.dropDate)
      .filter((d): d is Date => !!d && new Date(d).getTime() > now)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
    if (nextDrop) {
      countdown = { enabled: true, targetDate: new Date(nextDrop).toISOString().slice(0, 16), label: "Nächster Drop in" };
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-mono"
      style={{ backgroundImage: 'url("/background.webp")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <div className="relative z-10 flex flex-col min-h-screen t-invert">
        <GlobalHeader />
        <LandingSound />
        <PageViewTracker />

        {/* Hero */}
        <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-16 py-16 md:py-24 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 mb-4">Bellator Streetwear</p>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
              240g.<br />Oversized.<br />Limited.
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed mb-8 max-w-md">
              Streetwear ohne Kompromisse. Jedes Piece ist streng limitiert — wenn es weg ist, ist es weg.
            </p>
            <div className="mb-8 lg:mb-0 flex flex-wrap items-center gap-3">
              <Link href="/shop"
                className="inline-block bg-white border-[3px] border-white px-8 py-4 text-sm font-black uppercase tracking-widest text-black hover:bg-transparent hover:text-white transition-all duration-200">
                Zum Shop →
              </Link>
              {!user && (
                <Link href="/login"
                  className="inline-block bg-white border-[3px] border-white px-8 py-4 text-sm font-black uppercase tracking-widest text-black hover:bg-transparent hover:text-white transition-all duration-200">
                  Login / Registrieren
                </Link>
              )}
            </div>
          </div>
          {countdown.enabled && (
            <div className="lg:shrink-0">
              <p className="text-center text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
                <span className="text-white font-bold">{userCount}</span> Aktive User
              </p>
              <CountdownBanner initialConfig={countdown} variant="stacked" />
            </div>
          )}
        </section>

        {/* Blog Posts */}
        <section className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-16 pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">Neuigkeiten</h2>
            <Link href="/news" className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition">
              Alle ansehen →
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="border border-zinc-800 bg-black/60 p-12 text-center">
              <p className="text-xs text-zinc-600 uppercase tracking-widest">Noch keine Posts veröffentlicht.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/post/${post.id}`} className="border border-zinc-700 bg-black/80 flex flex-col hover:border-zinc-500 transition-all group">
                  {post.imageUrl && (
                    <div className="aspect-video overflow-hidden border-b border-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    </div>
                  )}
                  {post.videoUrl && !post.imageUrl && (
                    <div className="aspect-video border-b border-zinc-800 pointer-events-none">
                      <iframe src={post.videoUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen tabIndex={-1} />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[9px] uppercase tracking-widest text-zinc-500 border border-zinc-700 px-2 py-0.5">
                        {CATEGORY_LABELS[post.category ?? "article"] ?? post.category}
                      </span>
                      <span className="text-[9px] text-zinc-700 uppercase tracking-widest">
                        {new Date(post.createdAt ?? Date.now()).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="text-base font-black uppercase tracking-tight text-white leading-tight flex-1">{post.title}</h3>
                    {post.body && (
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-3">{post.body}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="w-full border-t border-zinc-800 bg-black/60">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 md:px-16 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Keinen Drop verpassen.</h2>
              <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Discord beitreten für Early-Access und Previews</p>
            </div>
            <a href="https://discord.gg/T4RwVJRyRp" target="_blank" rel="noopener noreferrer"
              className="border-[3px] border-white bg-white text-black px-6 py-3 text-sm font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-200 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.102 18.079.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Discord
            </a>
          </div>
        </section>

        <GlobalFooter />
      </div>
    </div>
  );
}
