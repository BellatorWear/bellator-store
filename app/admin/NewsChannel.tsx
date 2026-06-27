"use client";
import { useState } from "react";
import { createNewsPost } from "./actions";

type Post = { id: number; title: string; body: string; createdAt: Date | null; pushSentAt: Date | null; emailSentAt: Date | null };

export default function NewsChannel({ recentPosts }: { recentPosts: Post[] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("body", body);
      const res = await createNewsPost(fd);
      if (res?.error) {
        setResult({ text: res.error, type: "error" });
        return;
      }
      const parts: string[] = [];
      parts.push(res.pushError ? `Push: ${res.pushError}` : `Push an ${res.pushSent} User gesendet`);
      parts.push(res.emailError ? `Mail: ${res.emailError}` : `Mail an ${res.emailSent} Abonnenten gesendet`);
      setResult({ text: `✓ Veröffentlicht. ${parts.join(" · ")}`, type: "success" });
      setTitle("");
      setBody("");
    } catch (err) {
      console.error("News-Post fehlgeschlagen:", err);
      setResult({ text: "Fehler. Bitte nochmal versuchen.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border border-zinc-700 p-4 sm:p-6 space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">News-Channel</h2>
      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Jeder Post geht sofort als Push-Benachrichtigung an alle User mit aktivierten Push-Benachrichtigungen
        UND als Newsletter-Mail an alle Newsletter-Abonnenten raus.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel" required maxLength={100}
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Text" required maxLength={2000} rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 resize-none" />
        {result && <p className={`text-[10px] uppercase tracking-widest ${result.type === "error" ? "text-red-500" : "text-green-500"}`}>{result.text}</p>}
        <button type="submit" disabled={loading}
          className="border border-zinc-500 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50">
          {loading ? "Wird gesendet..." : "Veröffentlichen & senden"}
        </button>
      </form>

      {recentPosts.length > 0 && (
        <div className="pt-2 border-t border-zinc-800 space-y-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Letzte Posts</p>
          {recentPosts.map((p) => (
            <div key={p.id} className="text-xs border border-zinc-800 p-2">
              <p className="font-bold text-zinc-300">{p.title}</p>
              <p className="text-zinc-500 text-[11px] mt-0.5">{p.body}</p>
              <p className="text-[9px] text-zinc-600 mt-1">
                {p.pushSentAt ? "Push ✓" : "Push ✕"} · {p.emailSentAt ? "Mail ✓" : "Mail ✕"}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
