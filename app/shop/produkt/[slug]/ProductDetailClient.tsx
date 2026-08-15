"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { addToCart } from "@/app/cart";
import PriceDisplay from "@/app/shop/components/PriceDisplay";
import { subscribeRestock } from "@/app/shop/restock";
import { queueCartItem } from "@/app/utils/offlineQueue";
import SmartImage from "@/app/components/SmartImage";

// Lazy geladen (next/dynamic) statt statisch importiert: das komplette
// Admin-Bearbeiten-Formular (inkl. updateProduct-Action-Referenz) soll
// nicht im JS-Bundle jeder Produktseite für jeden normalen Besucher
// landen, sondern erst wenn ein Admin tatsächlich auf "Bearbeiten"
// klickt. ssr:false, weil das Formular ohnehin nur nach einem Klick
// (Client-Interaktion) sichtbar wird - serverseitiges Rendern bringt hier
// keinen Vorteil, nur unnötigen Server-Aufwand.
const ProductEditForm = dynamic(() => import("./ProductEditForm"), { ssr: false });

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

    // Offline: gar nicht erst versuchen, die Server Action aufzurufen
    // (die würde ohnehin nur mit einem Netzwerkfehler fehlschlagen) -
    // stattdessen direkt in die lokale Queue schreiben. Wird automatisch
    // synchronisiert, sobald wieder eine Verbindung besteht (siehe
    // app/components/OfflineSync.tsx). Hinweis: setzt voraus, dass der
    // User eingeloggt ist (wie beim normalen Kauf auch) - ist er es nicht,
    // schlägt der Sync später mit "Nicht eingeloggt" fehl; das lässt sich
    // ohne Netzwerk hier nicht vorab prüfen.
    if (!navigator.onLine) {
      try {
        await queueCartItem({
          clientId: crypto.randomUUID(),
          productId: product.id,
          variantId: variantId ?? null,
          colorId: colorId ?? null,
          quantity: 1,
          productName: product.name,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } catch (e) {
        console.error("Offline-Queue fehlgeschlagen:", e);
        setErr("Du bist offline und dein Browser unterstützt keine Offline-Warenkorb-Speicherung.");
      } finally {
        setLoading(false);
      }
      return;
    }

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
    <main className="t-text font-mono pb-20 sm:pb-0">
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
            <div className="t-card border aspect-square relative flex items-center justify-center mb-4 overflow-hidden">
              {mainImage ? (
                <SmartImage src={mainImage} alt={product.name} className="object-contain p-4" />
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
                      <SmartImage src={img} alt={`${product.name} – Ansicht ${i + 1}`} width={64} height={64} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Info / Edit */}
          <div className="flex flex-col justify-center t-card border p-5 sm:p-6 space-y-5">
            {editing ? (
              <ProductEditForm product={product} onCancel={() => setEditing(false)} />
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
                {(soldOut || variantSoldOut) && (
                  <NotifyMeForm productId={product.id} variantId={variantSoldOut ? variantId : null} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Mobile CTA: der normale "Zum Warenkorb"-Button liegt bei
          längerer Produktbeschreibung oft weit unterhalb des sichtbaren
          Bereichs. Auf Mobile (< sm) bleibt dieser Balken deshalb immer
          am unteren Bildschirmrand sichtbar, damit der Kauf-Impuls nicht
          erst durch Scrollen verpufft. Nur wenn nicht im Edit-Modus. */}
      {!editing && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur border-t border-zinc-700 px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest t-muted truncate">{product.name}</p>
            <PriceDisplay priceCents={product.priceCents} compareAtPriceCents={product.compareAtPriceCents} />
          </div>
          <button onClick={handleAdd} disabled={loading || soldOut || variantSoldOut}
            className="shrink-0 py-3 px-5 t-btn-primary font-black uppercase tracking-widest transition text-xs disabled:opacity-50">
            {soldOut || variantSoldOut ? "Ausverkauft" : added ? "✓" : loading ? "..." : "In den Warenkorb"}
          </button>
        </div>
      )}
    </main>
  );
}

function NotifyMeForm({ productId, variantId }: { productId: number; variantId: number | null }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setErr("");
    try {
      const fd = new FormData();
      fd.append("productId", String(productId));
      if (variantId) fd.append("variantId", String(variantId));
      fd.append("email", email.trim());
      const res = await subscribeRestock(fd);
      if (res?.error) {
        setErr(res.error);
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setErr("Fehler. Bitte nochmal versuchen.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="text-xs text-green-500 uppercase tracking-widest text-center">
        ✓ Wir sagen Bescheid, sobald es wieder da ist.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Deine Email (weglassen wenn eingeloggt)"
          className="flex-1 min-w-0 t-input border px-3 py-2.5 text-sm outline-none transition"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="border t-border px-4 py-2.5 text-xs uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-200 active:scale-[0.97] disabled:opacity-50 shrink-0"
        >
          {state === "loading" ? "..." : "Benachrichtigen"}
        </button>
      </form>
      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}
    </div>
  );
}
