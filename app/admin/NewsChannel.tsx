"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNewsPost, updateNewsPost, deleteNewsPost } from "./actions";
import ConfirmDialog from "./ConfirmDialog";
import RichContentEditor, { type Attachment } from "./RichContentEditor";

type Post = {
  id: number;
  title: string;
  body: string;
  bodyHtml: string | null;
  attachments: Attachment[] | null;
  createdAt: Date | null;
  pushSentAt: Date | null;
  emailSentAt: Date | null;
};

export default function NewsChannel({ recentPosts, canEdit = true }: { recentPosts: Post[]; canEdit?: boolean }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("body", body);
      fd.append("bodyHtml", bodyHtml);
      fd.append("attachments", JSON.stringify(attachments));
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
      setBodyHtml("");
      setAttachments([]);
      router.refresh();
    } catch (err) {
      console.error("News-Post fehlgeschlagen:", err);
      setResult({ text: "Fehler. Bitte nochmal versuchen.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const fd = new FormData();
      fd.append("id", String(deleteId));
      await deleteNewsPost(fd);
      router.refresh();
    } catch (err) {
      console.error("News-Post löschen fehlgeschlagen:", err);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Jeder Post geht sofort als Push-Benachrichtigung an alle User mit aktivierten Push-Benachrichtigungen
        UND als Newsletter-Mail an alle Newsletter-Abonnenten raus.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel" required maxLength={100}
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Kurztext (für Push-Benachrichtigung)" required maxLength={2000} rows={2}
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 resize-none" />
        <div>
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">
            Erweiterter HTML-Inhalt für die Mail (optional - wenn leer, wird der Kurztext oben verwendet)
          </p>
          <RichContentEditor value={bodyHtml} onChange={setBodyHtml} attachments={attachments} onAttachmentsChange={setAttachments} />
        </div>
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
            <div key={p.id} className="text-xs border border-zinc-800 p-2 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-300">{p.title}</p>
                  <p className="text-zinc-500 text-[11px] mt-0.5">{p.body}</p>
                  <p className="text-[9px] text-zinc-600 mt-1">
                    {p.pushSentAt ? "Push ✓" : "Push ✕"} · {p.emailSentAt ? "Mail ✓" : "Mail ✕"}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                      className="text-[9px] border border-zinc-700 px-2 py-1 uppercase tracking-widest hover:bg-white hover:text-black transition">
                      {editingId === p.id ? "Zuklappen" : "Bearbeiten"}
                    </button>
                    <button onClick={() => setDeleteId(p.id)}
                      className="text-[9px] border border-red-800 text-red-500 px-2 py-1 hover:bg-red-900/30 transition">
                      Löschen
                    </button>
                  </div>
                )}
              </div>
              {editingId === p.id && (
                <NewsPostEditForm post={p} onSaved={() => { setEditingId(null); router.refresh(); }} onCancel={() => setEditingId(null)} />
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Post löschen?"
        message="Dieser Newsletter-Post wird unwiderruflich gelöscht (die bereits versendete Mail bleibt bei den Empfängern natürlich bestehen)."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function NewsPostEditForm({ post, onSaved, onCancel }: { post: Post; onSaved: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [bodyHtml, setBodyHtml] = useState(post.bodyHtml ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>(post.attachments ?? []);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (loading || !title.trim() || !body.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("id", String(post.id));
      fd.append("title", title);
      fd.append("body", body);
      fd.append("bodyHtml", bodyHtml);
      fd.append("attachments", JSON.stringify(attachments));
      const res = await updateNewsPost(fd);
      if (res?.error) { setErr(res.error); return; }
      onSaved();
    } catch (e) {
      console.error("News-Post speichern fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-zinc-800 pt-2 space-y-2">
      <p className="text-[9px] text-yellow-600 uppercase tracking-widest">
        Korrigiert nur den gespeicherten Post - schickt Push/Mail NICHT erneut raus.
      </p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel" maxLength={100}
        className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Kurztext" maxLength={2000} rows={2}
        className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 resize-none" />
      <RichContentEditor value={bodyHtml} onChange={setBodyHtml} attachments={attachments} onAttachmentsChange={setAttachments} />
      {err && <p className="text-[9px] text-red-500 uppercase tracking-widest">{err}</p>}
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
