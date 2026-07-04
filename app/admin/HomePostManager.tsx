"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHomePost, deleteHomePost, toggleHomePostPublished } from "./actions";
import ConfirmDialog from "./ConfirmDialog";

type Post = {
  id: number;
  title: string;
  category: string | null;
  published: boolean | null;
  createdAt: Date | null;
};

const CATEGORIES = [
  { value: "article", label: "Artikel" },
  { value: "video", label: "Video" },
  { value: "leak", label: "Leak" },
  { value: "makingof", label: "Making Of" },
];

export default function HomePostManager({ posts }: { posts: Post[] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState("article");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !title.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("body", body);
      fd.append("imageUrl", imageUrl);
      fd.append("videoUrl", videoUrl);
      fd.append("category", category);
      const res = await createHomePost(fd);
      if (res?.error) { setMsg({ text: res.error, type: "error" }); return; }
      setMsg({ text: "✓ Post angelegt.", type: "success" });
      setTitle(""); setBody(""); setImageUrl(""); setVideoUrl(""); setCategory("article");
      router.refresh();
    } catch (err) {
      console.error("Home-Post Fehler:", err);
      setMsg({ text: "Fehler.", type: "error" });
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const fd = new FormData();
      fd.append("id", String(deleteId));
      await deleteHomePost(fd);
      router.refresh();
    } catch (err) {
      console.error("Post löschen Fehler:", err);
    } finally { setDeleting(false); setDeleteId(null); }
  }

  async function togglePublish(id: number) {
    const fd = new FormData();
    fd.append("id", String(id));
    await toggleHomePostPublished(fd);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titel" required
            className="flex-1 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600" />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 p-2 text-sm text-white">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Text (optional)" rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 resize-none" />
        <div className="flex gap-3">
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Bild-URL (optional)"
            className="flex-1 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600" />
          <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Video-URL (optional, YouTube embed)"
            className="flex-1 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600" />
        </div>
        {msg && <p className={`text-[10px] uppercase tracking-widest ${msg.type === "error" ? "text-red-500" : "text-green-500"}`}>{msg.text}</p>}
        <button type="submit" disabled={loading}
          className="border border-zinc-500 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50">
          {loading ? "..." : "Post anlegen"}
        </button>
      </form>

      <div className="space-y-2">
        {posts.length === 0 && <p className="text-xs text-zinc-600">Noch keine Posts.</p>}
        {posts.map(post => (
          <div key={post.id} className="border border-zinc-800 p-3 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[9px] border border-zinc-700 px-1.5 py-0.5 text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                {CATEGORIES.find(c => c.value === post.category)?.label ?? post.category}
              </span>
              <span className="text-xs font-bold text-white truncate">{post.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => togglePublish(post.id)}
                className={`text-[10px] border px-2 py-1 uppercase tracking-widest transition ${
                  post.published ? "border-green-700 text-green-400 hover:bg-red-900/20 hover:border-red-700 hover:text-red-400" : "border-zinc-600 text-zinc-500 hover:border-green-700 hover:text-green-400"
                }`}>
                {post.published ? "Veröffentlicht" : "Entwurf"}
              </button>
              <button onClick={() => setDeleteId(post.id)}
                className="text-[10px] border border-red-800 text-red-500 px-2 py-1 hover:bg-red-900/30 transition">
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Post löschen?"
        message="Dieser Startseiten-Post wird unwiderruflich gelöscht."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
