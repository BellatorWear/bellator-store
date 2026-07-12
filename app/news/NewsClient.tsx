"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

type Attachment = { url: string; name: string };

type NewsletterPost = {
  type: "newsletter";
  id: number;
  title: string;
  body: string;
  bodyHtml: string | null;
  attachments: Attachment[] | null;
  createdAt: Date | null;
  emailSentAt: Date | null;
};

type HomePost = {
  type: "home";
  id: number;
  title: string;
  body: string | null;
  bodyHtml: string | null;
  attachments: Attachment[] | null;
  createdAt: Date | null;
  category: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
};

type Post = NewsletterPost | HomePost;

const CATEGORY_LABELS: Record<string, string> = {
  article: "Artikel",
  video: "Video",
  leak: "Leak",
  makingof: "Making Of",
};

export default function NewsClient({ posts }: { posts: Post[] }) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.toLowerCase();
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) || (p.body ?? "").toLowerCase().includes(q)
    );
  }, [posts, query]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="News durchsuchen..."
          className="w-full bg-zinc-900 border border-zinc-700 py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-white outline-none transition"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-zinc-800 bg-black/60 p-12 text-center">
          <p className="text-xs text-zinc-600 uppercase tracking-widest">
            {query ? `Keine Ergebnisse für "${query}".` : "Noch keine News."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(post => {
            // Startseiten-Posts (Artikel/Video/Leak/Making-Of) verlinken direkt
            // auf ihre eigene Detailseite statt hier inline aufzuklappen -
            // dort gibt es auch das Titelbild/Video in voller Größe.
            if (post.type === "home") {
              return (
                <Link
                  key={`home-${post.id}`}
                  href={`/post/${post.id}`}
                  className="block border border-zinc-700 bg-black/80 p-5 sm:p-6 hover:border-zinc-500 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-widest text-zinc-500 border border-zinc-700 px-2 py-0.5">
                        {CATEGORY_LABELS[post.category ?? "article"] ?? post.category}
                      </span>
                      <h2 className="text-base font-black uppercase tracking-tight text-white">{post.title}</h2>
                    </div>
                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest whitespace-nowrap">
                      {new Date(post.createdAt ?? Date.now()).toLocaleDateString("de-DE", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                      })}
                    </span>
                  </div>
                  {post.body && (
                    <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">{post.body}</p>
                  )}
                  <span className="mt-4 inline-block text-[10px] uppercase tracking-widest border border-zinc-700 px-3 py-1.5 hover:bg-white hover:text-black transition-all">
                    Weiterlesen →
                  </span>
                </Link>
              );
            }

            // Newsletter-Mails behalten das bisherige Verhalten: Inline
            // aufklappbar, zeigt die tatsächlich versendete Mail-Ansicht.
            const expanded = expandedId === post.id;
            const contentHtml = post.bodyHtml?.trim()
              ? post.bodyHtml
              : `<p style="line-height:1.6; white-space:pre-wrap;">${post.body}</p>`;
            return (
              <article key={`newsletter-${post.id}`} className="border border-zinc-700 bg-black/80 p-5 sm:p-6 hover:border-zinc-500 transition-all">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <h2 className="text-base font-black uppercase tracking-tight text-white">{post.title}</h2>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest whitespace-nowrap">
                    {new Date(post.createdAt ?? Date.now()).toLocaleDateString("de-DE", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{post.body}</p>

                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : post.id)}
                  className="mt-4 text-[10px] uppercase tracking-widest border border-zinc-700 px-3 py-1.5 hover:bg-white hover:text-black transition-all"
                >
                  {expanded ? "Einklappen" : "Erweitern"}
                </button>

                {expanded && (
                  <div className="mt-4">
                    {post.emailSentAt ? (
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">
                        So kam die Mail bei den Abonnenten an ({new Date(post.emailSentAt).toLocaleDateString("de-DE")})
                      </p>
                    ) : (
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">
                        Vorschau — als Mail wurde dieser Post nicht verschickt.
                      </p>
                    )}
                    <div style={{ fontFamily: "'Courier New', monospace", background: "#000", color: "#e0e0e0" }} className="border border-zinc-700 p-6 sm:p-8">
                      <div style={{ borderBottom: "3px solid white", paddingBottom: 16, marginBottom: 24 }}>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "white" }}>BELLATOR.</p>
                      </div>
                      <h3 style={{ color: "white", textTransform: "uppercase", marginTop: 0 }}>{post.title}</h3>
                      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                      {post.attachments && post.attachments.length > 0 && (
                        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #222" }}>
                          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: 8 }}>Anhänge</p>
                          {post.attachments.map((a) => (
                            <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
                              style={{ display: "block", fontSize: 12, color: "#ccc", marginBottom: 4 }}>
                              📎 {a.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
