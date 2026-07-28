"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import type { FeaturedReview } from "./shop/reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "text-white" : "text-zinc-700"}>★</span>
      ))}
    </div>
  );
}

export default function ReviewsBanner({ reviews }: { reviews: FeaturedReview[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (reviews.length === 0) return null;

  // Auf Desktop zeigen wir mehrere Karten nebeneinander, auf Mobile eine
  // pro "Seite" - der Index bewegt sich in Dreier-Schritten je nach dem,
  // wie viele Karten die aktuelle Bildschirmgröße zeigt (per CSS
  // gesteuert, hier nehmen wir konservativ 1 Schritt pro Klick/Swipe an,
  // damit es auf jeder Breite sauber aussieht).
  const visibleCount = 3;
  const maxIndex = Math.max(0, reviews.length - visibleCount);

  function showPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }
  function showNext() {
    setIndex((i) => Math.min(maxIndex, i + 1));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const SWIPE_THRESHOLD = 40;
    if (delta > SWIPE_THRESHOLD) showPrev();
    else if (delta < -SWIPE_THRESHOLD) showNext();
  }

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-16 pb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">Was Kunden sagen</h2>
      </div>

      <div className="relative group" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="overflow-hidden">
          <div
            className="flex gap-4 transition-transform duration-300 ease-out"
            style={{ transform: `translateX(calc(-${index} * (100% / ${visibleCount} + 1rem)))` }}
          >
            {reviews.map((r) => (
              <Link
                key={r.id}
                href={`/shop/produkt/${r.productSlug}`}
                className="shrink-0 w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.7rem)] border border-zinc-800 bg-black/60 p-5 hover:border-zinc-600 transition-all duration-200"
              >
                <Stars rating={r.rating} />
                <h3 className="font-bold text-sm mt-2 mb-1 truncate">{r.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{r.body}</p>
                <p className="text-[9px] uppercase tracking-widest text-zinc-600 mt-3">
                  {r.username ?? "Verifizierter Kauf"} · {r.productName}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {reviews.length > visibleCount && (
          <>
            <button
              type="button"
              onClick={showPrev}
              disabled={index === 0}
              aria-label="Vorherige Bewertungen"
              className="hidden sm:flex absolute left-[-2.5rem] top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-0"
            >
              <span className="block w-0 h-0" style={{ borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderRight: "10px solid white" }} />
            </button>
            <button
              type="button"
              onClick={showNext}
              disabled={index >= maxIndex}
              aria-label="Weitere Bewertungen"
              className="hidden sm:flex absolute right-[-2.5rem] top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-0"
            >
              <span className="block w-0 h-0" style={{ borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: "10px solid white" }} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
