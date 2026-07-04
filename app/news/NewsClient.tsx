"use client";
import { useState, useMemo } from "react";

type Post = { id: number; title: string; body: string; createdAt: Date | null };

export default function NewsClient({ posts }: { posts: Post[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.toLowerCase();
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
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
          {filtered.map(post => (
            <article key={post.id} className="border border-zinc-700 bg-black/80 p-5 sm:p-6 hover:border-zinc-500 transition-all">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <h2 className="text-base font-black uppercase tracking-tight text-white">{post.title}</h2>
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest whitespace-nowrap">
                  {new Date(post.createdAt ?? Date.now()).toLocaleDateString("de-DE", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{post.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
