"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addToCart } from "@/app/cart";

type Variant = { id: number; label: string; stock: number | null };
type Product = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  images: string[] | null;
  dropLabel: string | null;
  dropLimit: number | null;
  soldCount: number | null;
};

export default function ProductDetailClient({ product, variants }: { product: Product; variants: Variant[] }) {
  const images = product.images && product.images.length > 0 ? product.images : [];
  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState<number | null>(variants[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const remaining = product.dropLimit ? product.dropLimit - (product.soldCount ?? 0) : null;
  const soldOut = remaining !== null && remaining <= 0;
  const selectedVariant = variants.find((v) => v.id === variantId);
  const variantSoldOut = selectedVariant ? selectedVariant.stock !== null && selectedVariant.stock <= 0 : false;

  async function handleAdd() {
    setLoading(true);
    const fd = new FormData();
    fd.append("productId", String(product.id));
    if (variantId) fd.append("variantId", String(variantId));
    fd.append("quantity", "1");
    await addToCart(fd);
    setLoading(false);
    setAdded(true);
    router.refresh();
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <main className="t-text font-mono">
      <div className="max-w-[1000px] mx-auto py-8 px-4 md:py-16">
        <Link href="/shop" className="text-[10px] t-muted uppercase tracking-widest hover:t-text transition mb-8 inline-block">
          ← Zurück zum Shop
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Bilder */}
          <div className="flex flex-col">
            <div className="t-card border aspect-square flex items-center justify-center mb-4 overflow-hidden">
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[activeImage]} alt={product.name} className="max-h-full w-full object-contain p-4" />
              ) : (
                <span className="text-xs t-faint uppercase tracking-widest">Kein Bild</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 border overflow-hidden ${i === activeImage ? "border-white" : "t-border-s opacity-60"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center t-card border p-5 sm:p-6 space-y-5">
            <div>
              <h4 className="text-xs uppercase tracking-[0.3em] t-muted mb-2">{product.dropLabel || "Bellator Drop"}</h4>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase t-text leading-tight">{product.name}</h1>
            </div>

            {remaining !== null && (
              <span className={`text-[10px] uppercase tracking-widest font-bold border px-3 py-1.5 w-fit ${soldOut ? "text-red-400 border-red-700" : "text-green-400 border-green-800"}`}>
                {soldOut ? "Ausverkauft" : `Noch ${remaining} Stück`}
              </span>
            )}

            {variants.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest t-muted mb-2">Variante</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const vSoldOut = v.stock !== null && v.stock <= 0;
                    return (
                      <button key={v.id} onClick={() => setVariantId(v.id)} disabled={vSoldOut}
                        className={`px-4 py-2 text-xs sm:text-sm font-bold uppercase transition disabled:opacity-40 ${
                          variantId === v.id ? "t-btn-primary" : "t-btn-outline"
                        }`}>
                        {v.label} {vSoldOut ? "(aus)" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-2xl sm:text-3xl font-black t-text">{(product.priceCents / 100).toFixed(2)} €</p>
            <p className="leading-relaxed text-sm t-muted">{product.description}</p>

            <button onClick={handleAdd} disabled={loading || soldOut || variantSoldOut}
              className="w-full py-3 t-btn-primary font-black uppercase tracking-widest transition text-sm disabled:opacity-50">
              {soldOut || variantSoldOut ? "Ausverkauft" : added ? "✓ Hinzugefügt" : loading ? "..." : "In den Warenkorb"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
