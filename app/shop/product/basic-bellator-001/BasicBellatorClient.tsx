"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/app/cart";
import PriceDisplay from "../../components/PriceDisplay";

const STATIC_VARIANTS = {
  black: { name: "Schwarz", front: "/black-front.webp", back: "/black-back.webp" },
  darkgrey: { name: "Dunkelgrau", front: "/grey-front.webp", back: "/grey-back.webp" },
} as const;
type ColorKey = keyof typeof STATIC_VARIANTS;

type DbVariant = { id: number; label: string; stock: number | null };
type DbProduct = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
} | null;

export default function BasicBellatorClient({ dbProduct, variants }: { dbProduct: DbProduct; variants: DbVariant[] }) {
  const [activeColor, setActiveColor] = useState<ColorKey>("black");
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  const currentVariant = STATIC_VARIANTS[activeColor];
  const activeImage = showBack ? currentVariant.back : currentVariant.front;

  // Die DB-Variante, deren Label zur ausgewählten Farbe passt (z.B. "Schwarz").
  const matchedDbVariant = variants.find(
    (v) => v.label.toLowerCase() === currentVariant.name.toLowerCase(),
  );
  const soldOutVariant = matchedDbVariant?.stock !== null && matchedDbVariant?.stock !== undefined && matchedDbVariant.stock <= 0;

  async function handleAddToCart() {
    if (!dbProduct) {
      setErr("Dieses Produkt ist noch nicht im Shop-System angelegt. Bitte Admin informieren.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("productId", String(dbProduct.id));
      if (matchedDbVariant) fd.append("variantId", String(matchedDbVariant.id));
      fd.append("quantity", "1");
      const res = await addToCart(fd);
      if (res?.error) {
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

  const price = dbProduct?.priceCents ?? 3500;
  const compareAt = dbProduct?.compareAtPriceCents ?? null;
  const description = dbProduct?.description ?? "Designed for those who never quit. Bellators First Drop.";

  return (
    <main className="t-text font-mono">
      <div className="max-w-[1000px] mx-auto py-8 px-4 md:py-16">
        <a href="/shop" className="text-[10px] t-muted uppercase tracking-widest hover:t-text transition mb-8 inline-block">
          ← Zurück zum Shop
        </a>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div className="flex flex-col">
            <div className="t-card border aspect-square flex items-center justify-center mb-4 overflow-hidden">
              <img src={activeImage} alt={currentVariant.name} className="max-h-full object-contain p-4" />
            </div>
            <button onClick={() => setShowBack(!showBack)}
              className="w-full py-3 t-btn-primary font-black uppercase tracking-widest transition text-sm">
              {showBack ? "Vorderseite" : "Rückseite"}
            </button>
          </div>

          <div className="flex flex-col justify-center t-card border p-5 sm:p-6 space-y-5">
            <div>
              <h4 className="text-xs uppercase tracking-[0.3em] t-muted mb-2">Bellators First Drop</h4>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase t-text leading-tight">Basic Bellator Shirt</h1>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-400 border border-yellow-700 px-3 py-1.5 w-fit">240g Heavy Cotton</span>
              <span className="text-[10px] uppercase tracking-widest font-bold t-text border t-border px-3 py-1.5 w-fit">Oversized Fit</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-red-400 border border-red-700 px-3 py-1.5 w-fit">Strictly Limited — 10 Pieces</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATIC_VARIANTS) as ColorKey[]).map((key) => (
                <button key={key} onClick={() => setActiveColor(key)}
                  className={`px-4 py-2 text-xs sm:text-sm font-bold uppercase transition ${
                    activeColor === key ? "t-btn-primary" : "t-btn-outline"
                  }`}>
                  {STATIC_VARIANTS[key].name}
                </button>
              ))}
            </div>

            <PriceDisplay priceCents={price} compareAtPriceCents={compareAt} />
            <p className="leading-relaxed text-sm t-muted">{description}</p>

            {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}

            <button onClick={handleAddToCart} disabled={loading || soldOutVariant}
              className="block w-full py-4 text-center uppercase font-black tracking-[0.2em] border-[3px] t-border t-text hover:bg-white hover:text-black transition-all duration-200 text-sm disabled:opacity-50">
              {soldOutVariant ? "Ausverkauft" : loading ? "..." : added ? "✓ Hinzugefügt" : "Zum Warenkorb hinzufügen"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
