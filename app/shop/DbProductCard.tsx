"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addToCart } from "@/app/cart";
import PriceDisplay from "./components/PriceDisplay";

type Variant = { id: number; label: string; stock: number | null };
type Color = { id: number; name: string; hexColor: string; frontImage: string; backImage: string };
type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  images: string[] | null;
  dropLabel: string | null;
  dropLimit: number | null;
  soldCount: number | null;
};

export default function DbProductCard({ product, variants, colors = [], isPreRelease = false }: { product: Product; variants: Variant[]; colors?: Color[]; isPreRelease?: boolean }) {
  const [variantId, setVariantId] = useState<number | null>(variants[0]?.id ?? null);
  const [colorId, setColorId] = useState<number | null>(colors[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const router = useRouter();

  const remaining = product.dropLimit ? product.dropLimit - (product.soldCount ?? 0) : null;
  const soldOut = remaining !== null && remaining <= 0;
  // Hauptbild(er) des Produkts selbst - unabhängig von der Farbauswahl.
  // War vorher fälschlich an die (immer standardmäßig erste) Farbe
  // gekoppelt, dadurch wurde nie das eigentliche Hauptbild gezeigt.
  const images = product.images && product.images.length > 0 ? product.images : [];
  const displayImage = images[imageIndex] ?? images[0];

  function showPrev(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  }
  function showNext(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((i) => (i + 1) % images.length);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || images.length < 2) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const SWIPE_THRESHOLD = 40;
    if (delta > SWIPE_THRESHOLD) setImageIndex((i) => (i - 1 + images.length) % images.length);
    else if (delta < -SWIPE_THRESHOLD) setImageIndex((i) => (i + 1) % images.length);
  }

  async function handleAdd() {
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("productId", String(product.id));
      if (variantId) fd.append("variantId", String(variantId));
      if (colorId) fd.append("colorId", String(colorId));
      fd.append("quantity", "1");
      const res = await addToCart(fd);
      if (res?.error) {
        if ((res as { requiresLogin?: boolean }).requiresLogin) {
          router.push("/login");
          return;
        }
        setErr(res.error);
      } else {
        setAdded(true);
        router.refresh();
        setTimeout(() => setAdded(false), 2000);
      }
    } catch (e) {
      console.error("Add to cart fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col t-card border-[3px] t-border p-5 sm:p-6"
      style={{ boxShadow: "8px 8px 0px 0px var(--shadow)" }}>
      <div className="flex justify-between items-center mb-4 text-[10px] uppercase tracking-widest">
        <span className="border border-zinc-600 px-2 py-1 t-muted font-bold">{product.dropLabel || "Drop"}</span>
        {isPreRelease && (
          <span className="border border-purple-600 px-2 py-1 text-purple-400 font-bold">Pre-Release</span>
        )}
        {soldOut ? (
          <span className="border border-red-700 px-2 py-1 text-red-400 font-bold">Ausverkauft</span>
        ) : remaining !== null ? (
          <span className="border border-green-800 px-2 py-1 text-green-400 font-bold">Noch {remaining} Stück</span>
        ) : null}
      </div>

      {displayImage && (
        <div
          className="relative group t-bg mb-5 overflow-hidden border t-border-s"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Link href={`/shop/produkt/${product.slug}`} className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayImage} alt={product.name}
              className="w-full h-auto block grayscale hover:grayscale-0 transition-all duration-300" />
          </Link>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrev}
                aria-label="Voriges Bild"
                className="absolute left-0 top-0 h-full w-10 flex items-center justify-start pl-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-black/30 to-transparent"
              >
                <span
                  className="block w-0 h-0"
                  style={{ borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderRight: "10px solid white" }}
                />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Nächstes Bild"
                className="absolute right-0 top-0 h-full w-10 flex items-center justify-end pr-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-l from-black/30 to-transparent"
              >
                <span
                  className="block w-0 h-0"
                  style={{ borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: "10px solid white" }}
                />
              </button>
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {images.map((_, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === imageIndex ? "bg-white" : "bg-white/40"}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <Link href={`/shop/produkt/${product.slug}`} className="block hover:opacity-80 transition">
        <h1 className="text-xl sm:text-2xl font-black uppercase t-text mb-2 leading-tight">{product.name}</h1>
      </Link>
      <p className="text-xs t-muted mb-3 flex-grow">{product.description}</p>
      <div className="mb-4">
        <PriceDisplay priceCents={product.priceCents} compareAtPriceCents={product.compareAtPriceCents} size="sm" />
      </div>

      {colors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {colors.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColorId(c.id)}
              title={c.name}
              className={`w-7 h-7 border transition-all ${colorId === c.id ? "border-white scale-110" : "border-zinc-600"}`}
              style={{ backgroundColor: c.hexColor }}
            />
          ))}
        </div>
      )}

      {variants.length > 0 && (
        <select value={variantId ?? ""} onChange={(e) => setVariantId(Number(e.target.value))}
          className="w-full t-input border p-2 mb-3 text-sm">
          {variants.map((v) => (
            <option key={v.id} value={v.id} disabled={v.stock !== null && v.stock <= 0}>
              {v.label} {v.stock !== null && v.stock <= 0 ? "(ausverkauft)" : ""}
            </option>
          ))}
        </select>
      )}

      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest mb-2">{err}</p>}

      <button onClick={handleAdd} disabled={loading || soldOut}
        className="block w-full py-4 text-center uppercase font-black tracking-[0.2em] border-[3px] t-border t-text hover:bg-white hover:text-black transition-all text-sm disabled:opacity-50">
        {soldOut ? "Ausverkauft" : added ? "✓ Hinzugefügt" : loading ? "..." : "Zum Warenkorb hinzufügen"}
      </button>
    </div>
  );
}
