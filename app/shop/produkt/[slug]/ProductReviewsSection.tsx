import { getProductReviews } from "../../reviews";

function Stars({ rating, size = "text-sm" }: { rating: number; size?: string }) {
  return (
    <div className={`flex gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "t-text" : "text-zinc-700"}>★</span>
      ))}
    </div>
  );
}

export default async function ProductReviewsSection({ productId }: { productId: number }) {
  const { reviews, average } = await getProductReviews(productId);

  if (reviews.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 pb-16 pt-4">
      <div className="flex items-center gap-4 mb-8 border-b t-border-s pb-6">
        <div>
          <p className="text-3xl font-black">{average?.toFixed(1)}</p>
          <Stars rating={average ?? 0} />
        </div>
        <p className="text-xs t-muted">
          Basiert auf {reviews.length} Bewertung{reviews.length === 1 ? "" : "en"}
        </p>
      </div>

      <div className="space-y-5">
        {reviews.map((r) => (
          <div key={r.id} className="border-b t-border-s pb-5 last:border-0">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
              <Stars rating={r.rating} />
              <span className="text-[10px] t-muted uppercase tracking-widest">
                {r.createdAt ? new Date(r.createdAt).toLocaleDateString("de-DE") : ""}
              </span>
            </div>
            <h3 className="font-bold text-sm mb-1">{r.title}</h3>
            <p className="text-sm t-muted leading-relaxed whitespace-pre-wrap">{r.body}</p>
            <p className="text-[10px] uppercase tracking-widest t-muted mt-2">
              {r.username ?? "Verifizierter Kauf"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
