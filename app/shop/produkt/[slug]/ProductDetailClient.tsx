"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addToCart } from "@/app/cart";
import { updateProduct } from "@/app/admin/actions";
import PriceDisplay from "@/app/shop/components/PriceDisplay";

type Variant = { id: number; label: string; stock: number | null };
type Color = { id: number; name: string; hexColor: string; frontImage: string; backImage: string };
type Product = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  images: string[] | null;
  dropLabel: string | null;
  dropLimit: number | null;
  soldCount: number | null;
  active?: boolean | null;
};

export default function ProductDetailClient({
  product,
  variants,
  colors,
  isAdmin,
}: {
  product: Product;
  variants: Variant[];
  colors: Color[];
  isAdmin: boolean;
}) {
  const images = product.images && product.images.length > 0 ? product.images : [];
  const [activeImage, setActiveImage] = useState(0);
  const [colorId, setColorId] = useState<number | null>(colors[0]?.id ?? null);
  const [showBack, setShowBack] = useState(false);
  const [variantId, setVariantId] = useState<number | null>(variants[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  // --- Admin Inline-Edit ---
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState((product.priceCents / 100).toString());
  const [compareAtPrice, setCompareAtPrice] = useState(product.compareAtPriceCents ? (product.compareAtPriceCents / 100).toString() : "");
  const [dropLabel, setDropLabel] = useState(product.dropLabel ?? "");
  const [dropLimit, setDropLimit] = useState(product.dropLimit ? String(product.dropLimit) : "");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const remaining = product.dropLimit ? product.dropLimit - (product.soldCount ?? 0) : null;
  const soldOut = remaining !== null && remaining <= 0;
  const selectedVariant = variants.find((v) => v.id === variantId);
  const variantSoldOut = selectedVariant ? selectedVariant.stock !== null && selectedVariant.stock <= 0 : false;
  const selectedColor = colors.find((c) => c.id === colorId);

  // Wenn Farben existieren, bestimmen sie das Bild (Vorder-/Rückseite je
  // nach Auswahl) - sonst fällt man auf das generische Bilder-Array zurück.
  const mainImage = selectedColor
    ? (showBack ? selectedColor.backImage : selectedColor.frontImage)
    : images[activeImage];

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

  async function saveEdit() {
    if (saving) return;
    setSaving(true);
    setSaveErr("");
    try {
      const fd = new FormData();
      fd.append("id", String(product.id));
      fd.append("name", name);
      fd.append("description", description);
      fd.append("price", price);
      fd.append("compareAtPrice", compareAtPrice);
      fd.append("dropLabel", dropLabel);
      fd.append("dropLimit", dropLimit);
      fd.append("active", String(product.active ?? true));
      const res = await updateProduct(fd);
      if (res?.error) {
        setSaveErr(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch (e) {
      console.error("Speichern fehlgeschlagen:", e);
      setSaveErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="t-text font-mono">
      <div className="max-w-[1000px] mx-auto py-8 px-4 md:py-16">
        <div className="flex justify-between items-center mb-8">
          <Link href="/shop" className="text-xs font-bold uppercase tracking-widest text-white bg-black/70 border border-zinc-500 px-3 py-1.5 hover:bg-white hover:text-black transition-all inline-block">
            ← Zurück zum Shop
          </Link>
          {isAdmin && !editing && (
            <button onClick={() => setEditing(true)}
              className="text-[10px] uppercase tracking-widest font-bold border t-border px-3 py-1.5 hover:bg-white hover:text-black transition">
              ✎ Als Admin bearbeiten
            </button>
          )}
        </div>

        {isAdmin && product.active === false && (
          <p className="text-[10px] uppercase tracking-widest text-red-500 border border-red-800 px-3 py-2 mb-6 w-fit">
            Inaktiv — nur für dich als Admin sichtbar
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Bilder */}
          <div className="flex flex-col">
            <div className="t-card border aspect-square flex items-center justify-center mb-4 overflow-hidden">
              {mainImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mainImage} alt={product.name} className="max-h-full w-full object-contain p-4" />
              ) : (
                <span className="text-xs t-faint uppercase tracking-widest">Kein Bild</span>
              )}
            </div>

            {selectedColor ? (
              <button onClick={() => setShowBack(!showBack)}
                className="w-full py-2.5 bg-white text-black border-[3px] border-white font-black uppercase tracking-widest text-xs mb-3 hover:bg-black hover:text-white hover:border-white transition-all">
                {showBack ? "Vorderseite zeigen" : "Rückseite zeigen"}
              </button>
            ) : (
              images.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`w-16 h-16 border overflow-hidden ${i === activeImage ? "border-white" : "t-border-s opacity-60"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Info / Edit */}
          <div className="flex flex-col justify-center t-card border p-5 sm:p-6 space-y-5">
            {editing ? (
              <div className="space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
                  className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Beschreibung"
                  className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white resize-none" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" placeholder="Preis (€)"
                    className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
                  <input value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} type="number" step="0.01" placeholder="Alter Preis (€, opt.)"
                    className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={dropLabel} onChange={(e) => setDropLabel(e.target.value)} placeholder="Drop-Label"
                    className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
                  <input value={dropLimit} onChange={(e) => setDropLimit(e.target.value)} type="number" placeholder="Drop-Limit"
                    className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
                </div>
                <p className="text-[9px] text-zinc-500">Größen & Farben lassen sich im Admin-Panel verwalten.</p>
                {saveErr && <p className="text-[10px] text-red-500 uppercase tracking-widest">{saveErr}</p>}
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving}
                    className="flex-1 t-btn-primary py-2.5 font-black text-xs uppercase tracking-widest transition disabled:opacity-50">
                    {saving ? "..." : "Speichern"}
                  </button>
                  <button onClick={() => setEditing(false)} disabled={saving}
                    className="flex-1 t-btn-outline py-2.5 font-black text-xs uppercase tracking-widest transition">
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h4 className="text-xs uppercase tracking-[0.3em] t-muted mb-2">{product.dropLabel || "Bellator Drop"}</h4>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase t-text leading-tight">{product.name}</h1>
                </div>

                {remaining !== null && (
                  <span className={`text-[10px] uppercase tracking-widest font-bold border px-3 py-1.5 w-fit ${soldOut ? "text-red-400 border-red-700" : "text-green-400 border-green-800"}`}>
                    {soldOut ? "Ausverkauft" : `Noch ${remaining} Stück`}
                  </span>
                )}

                {colors.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest t-muted mb-2">
                      Farbe{selectedColor ? `: ${selectedColor.name}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((c) => (
                        <button key={c.id} onClick={() => { setColorId(c.id); setShowBack(false); }}
                          title={c.name}
                          className={`w-10 h-10 border-2 transition-all ${colorId === c.id ? "border-white scale-110" : "border-zinc-600"}`}
                          style={{ backgroundColor: c.hexColor }} />
                      ))}
                    </div>
                  </div>
                )}

                {variants.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest t-muted mb-2">Größe</p>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((v) => {
                        const vSoldOut = v.stock !== null && v.stock <= 0;
                        return (
                          <button key={v.id} onClick={() => setVariantId(v.id)} disabled={vSoldOut}
                            className={`w-12 h-12 text-xs font-bold uppercase transition disabled:opacity-40 flex items-center justify-center ${
                              variantId === v.id ? "t-btn-primary" : "t-btn-outline"
                            }`}>
                            {v.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <PriceDisplay priceCents={product.priceCents} compareAtPriceCents={product.compareAtPriceCents} />
                <p className="leading-relaxed text-sm t-muted">{product.description}</p>

                {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}

                <button onClick={handleAdd} disabled={loading || soldOut || variantSoldOut}
                  className="w-full py-3 t-btn-primary font-black uppercase tracking-widest transition text-sm disabled:opacity-50">
                  {soldOut || variantSoldOut ? "Ausverkauft" : added ? "✓ Hinzugefügt" : loading ? "..." : "Zum Warenkorb hinzufügen"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
