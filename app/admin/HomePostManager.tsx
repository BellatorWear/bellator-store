"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHomePost, updateHomePost, deleteHomePost, toggleHomePostPublished } from "./actions";
import ConfirmDialog from "./ConfirmDialog";
import RichContentEditor, { type Attachment } from "./RichContentEditor";

type Post = {
  id: number;
  title: string;
  body: string | null;
  bodyHtml: string | null;
  attachments: Attachment[] | null;
  imageUrl: string | null;
  videoUrl: string | null;
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

export default function HomePostManager({ posts, canEdit = true }: { posts: Post[]; canEdit?: boolean }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState("article");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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
      fd.append("bodyHtml", bodyHtml);
      fd.append("attachments", JSON.stringify(attachments));
      fd.append("imageUrl", imageUrl);
      fd.append("videoUrl", videoUrl);
      fd.append("category", category);
      const res = await createHomePost(fd);
      if (res?.error) { setMsg({ text: res.error, type: "error" }); return; }
      setMsg({ text: "✓ Post angelegt.", type: "success" });
      setTitle(""); setBody(""); setBodyHtml(""); setAttachments([]); setImageUrl(""); setVideoUrl(""); setCategory("article");
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
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Kurztext (optional, für die Karten-Vorschau)" rows={2}
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 resize-none" />
        <div>
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">
            Erweiterter HTML-Inhalt für die Vollansicht (optional - Bilder direkt einfügen, frei formatieren)
          </p>
          <RichContentEditor value={bodyHtml} onChange={setBodyHtml} attachments={attachments} onAttachmentsChange={setAttachments} />
        </div>
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
          <div key={post.id} className="border border-zinc-800 p-3 space-y-3">
            <div className="flex flex-wrap gap-2 items-center justify-between">
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
                {canEdit && (
                  <>
                    <button onClick={() => setEditingId(editingId === post.id ? null : post.id)}
                      className="text-[10px] border border-zinc-700 px-2 py-1 uppercase tracking-widest hover:bg-white hover:text-black transition">
                      {editingId === post.id ? "Zuklappen" : "Bearbeiten"}
                    </button>
                    <button onClick={() => setDeleteId(post.id)}
                      className="text-[10px] border border-red-800 text-red-500 px-2 py-1 hover:bg-red-900/30 transition">
                      Löschen
                    </button>
                  </>
                )}
              </div>
            </div>
            {editingId === post.id && (
              <PostEditForm post={post} onSaved={() => { setEditingId(null); router.refresh(); }} onCancel={() => setEditingId(null)} />
            )}
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

function PostEditForm({ post, onSaved, onCancel }: { post: Post; onSaved: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body ?? "");
  const [bodyHtml, setBodyHtml] = useState(post.bodyHtml ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>(post.attachments ?? []);
  const [imageUrl, setImageUrl] = useState(post.imageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(post.videoUrl ?? "");
  const [category, setCategory] = useState(post.category ?? "article");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    setErr("");
    try {
      const { upload } = await import("@vercel/blob/client");
      const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/admin/upload" });
      setImageUrl(blob.url);
    } catch (uploadErr) {
      console.error("Bild-Upload fehlgeschlagen:", uploadErr);
      setErr("Bild-Upload fehlgeschlagen.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function save() {
    if (loading || !title.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("id", String(post.id));
      fd.append("title", title);
      fd.append("body", body);
      fd.append("bodyHtml", bodyHtml);
      fd.append("attachments", JSON.stringify(attachments));
      fd.append("imageUrl", imageUrl);
      fd.append("videoUrl", videoUrl);
      fd.append("category", category);
      const res = await updateHomePost(fd);
      if (res?.error) { setErr(res.error); return; }
      onSaved();
    } catch (e) {
      console.error("Post speichern fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-zinc-800 pt-3 space-y-3">
      <div className="flex gap-3">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titel"
          className="flex-1 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600" />
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 p-2 text-sm text-white">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div>
        <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Titelbild</p>
        <div className="flex items-center gap-3">
          <label className="w-20 h-20 border border-zinc-700 bg-zinc-900 flex items-center justify-center overflow-hidden cursor-pointer shrink-0">
            {uploadingImage ? (
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest">Lädt...</span>
            ) : imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Titelbild" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[8px] text-zinc-600 uppercase tracking-widest text-center px-1">Bild wählen</span>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
          {imageUrl && (
            <button type="button" onClick={() => setImageUrl("")}
              className="text-[10px] border border-red-800 text-red-500 px-2 py-1 uppercase tracking-widest hover:bg-red-900/30 transition">
              Bild entfernen
            </button>
          )}
        </div>
      </div>

      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Kurztext" rows={2}
        className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 resize-none" />
      <div>
        <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Erweiterter HTML-Inhalt</p>
        <RichContentEditor value={bodyHtml} onChange={setBodyHtml} attachments={attachments} onAttachmentsChange={setAttachments} />
      </div>
      <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Video-URL (optional)"
        className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600" />

      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={loading}
          className="border border-zinc-500 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition disabled:opacity-50">
          {loading ? "..." : "Speichern"}
        </button>
        <button type="button" onClick={onCancel} disabled={loading}
          className="border border-zinc-700 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400">
          Abbrechen
        </button>
      </div>
    </div>
  );
}
