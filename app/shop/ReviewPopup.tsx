"use client";
import { useState } from "react";
import { submitProductReview, type PendingReviewProduct } from "./reviews";

export default function ReviewPopup({ products }: { products: PendingReviewProduct[] }) {
  const [queue, setQueue] = useState(products);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || queue.length === 0) return null;
  const current = queue[0];

  function resetForm() {
    setRating(0);
    setHoverRating(0);
    setTitle("");
    setBody("");
    setErr("");
  }

  function next() {
    resetForm();
    setQueue((q) => q.slice(1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (rating < 1) { setErr("Bitte 1-5 Sterne vergeben."); return; }
    if (!title.trim()) { setErr("Bitte einen Titel angeben."); return; }
    if (!body.trim()) { setErr("Bitte eine Beschreibung angeben."); return; }

    setSaving(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("productId", String(current.productId));
      fd.append("orderId", String(current.orderId));
      fd.append("rating", String(rating));
      fd.append("title", title.trim());
      fd.append("body", body.trim());
      const res = await submitProductReview(fd);
      if (res?.error) { setErr(res.error); return; }
      next();
    } catch (err) {
      console.error("Review absenden fehlgeschlagen:", err);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4" onClick={() => setDismissed(true)}>
      <div
        className="t-card border w-full max-w-md p-6 space-y-4 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] t-muted">Wie gefällt dir</p>
            <h2 className="text-lg font-black uppercase tracking-tight">{current.productName}</h2>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-zinc-500 hover:text-white transition text-lg leading-none shrink-0"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        {current.productImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.productImage} alt={current.productName} className="w-full aspect-square object-cover border t-border-s" />
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-3xl leading-none transition-transform active:scale-90"
                aria-label={`${star} Sterne`}
              >
                <span className={(hoverRating || rating) >= star ? "text-white" : "text-zinc-700"}>★</span>
              </button>
            ))}
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="Titel deiner Bewertung"
            className="w-full t-input border px-3 py-2 text-sm outline-none transition"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Was gefällt dir (oder nicht)?"
            className="w-full t-input border px-3 py-2 text-sm outline-none transition"
          />

          {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={next}
              disabled={saving}
              className="flex-1 border t-border t-muted py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
            >
              Nicht jetzt
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 t-btn-primary py-2.5 text-[10px] uppercase tracking-widest font-black transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
            >
              {saving ? "..." : "Absenden"}
            </button>
          </div>

          {queue.length > 1 && (
            <p className="text-[9px] t-muted text-center uppercase tracking-widest">
              Noch {queue.length - 1} weitere{queue.length - 1 === 1 ? "s" : ""} Produkt{queue.length - 1 === 1 ? "" : "e"} zu bewerten
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
