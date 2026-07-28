"use client";
import { useState } from "react";
import { deleteReview } from "./actions";

type AdminReview = {
  id: number;
  rating: number;
  title: string;
  body: string;
  createdAt: Date | null;
  productId: number | null;
  productName: string;
  username: string | null;
  userId: number | null;
};

// Gleiches Bestätigungsdialog-Muster wie z.B. in RoleManager.tsx - noch
// keine geteilte Modal-Komponente im Projekt.
function ConfirmDeleteModal({
  message,
  loading,
  onConfirm,
  onCancel,
}: {
  message: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-black border-[2px] border-red-800 w-full max-w-sm p-6 font-mono" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-zinc-300 uppercase tracking-widest leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={loading}
            className="flex-1 border border-zinc-700 text-zinc-300 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50">
            Abbrechen
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className="flex-1 border-[2px] border-red-700 text-red-500 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 hover:text-white transition-all disabled:opacity-50">
            {loading ? "..." : "Löschen"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewManager({ reviews: initialReviews }: { reviews: AdminReview[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [deleting, setDeleting] = useState<AdminReview | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [err, setErr] = useState("");

  const filtered = reviews.filter((r) => {
    if (ratingFilter && r.rating !== Number(ratingFilter)) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        (r.username ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function confirmDelete() {
    if (!deleting || deleteLoading) return;
    setDeleteLoading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("id", String(deleting.id));
      const res = await deleteReview(fd);
      if (res?.error) { setErr(res.error); return; }
      setReviews((prev) => prev.filter((r) => r.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      console.error("Review löschen fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche (Titel, Text, Produkt, User)..."
          className="flex-1 min-w-[180px] bg-zinc-900 border border-zinc-700 p-2 text-xs text-white placeholder:text-zinc-600"
        />
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 p-2 text-xs text-white"
        >
          <option value="">Alle Sterne</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} ★</option>
          ))}
        </select>
      </div>

      <p className="text-[9px] text-zinc-600 uppercase tracking-widest">
        {filtered.length} / {reviews.length} Reviews
      </p>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-zinc-600 p-4 border border-zinc-800">Keine Reviews gefunden.</p>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm">{"★".repeat(r.rating)}<span className="text-zinc-700">{"★".repeat(5 - r.rating)}</span></span>
                    <span className="text-[9px] text-zinc-600 uppercase tracking-widest">{r.productName}</span>
                  </div>
                  <p className="text-sm font-bold text-white mt-1">{r.title}</p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{r.body}</p>
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-2">
                    {r.username ?? "Verifizierter Kauf"}
                    {r.createdAt && ` · ${new Date(r.createdAt).toLocaleDateString("de-DE")}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setErr(""); setDeleting(r); }}
                  className="text-[9px] text-zinc-600 hover:text-red-500 transition uppercase tracking-widest shrink-0"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}

      {deleting && (
        <ConfirmDeleteModal
          message={`Review "${deleting.title}" von ${deleting.username ?? "diesem User"} wirklich löschen? Das kann nicht rückgängig gemacht werden.`}
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => { if (!deleteLoading) setDeleting(null); }}
        />
      )}
    </div>
  );
}
