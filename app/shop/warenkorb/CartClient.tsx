"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeFromCart, updateCartQuantity, createCheckoutSession } from "@/app/cart";

type CartItem = {
  id: number;
  name: string;
  variantLabel: string | null;
  colorName: string | null;
  dropLabel: string | null;
  image: string | null;
  unitPriceCents: number;
  quantity: number;
};

export default function CartClient({ initialCart }: { initialCart: CartItem[] }) {
  const [cart, setCart] = useState(initialCart);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  const total = cart.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  async function remove(itemId: number) {
    const fd = new FormData();
    fd.append("itemId", String(itemId));
    await removeFromCart(fd);
    setCart((c) => c.filter((i) => i.id !== itemId));
  }

  async function updateQty(itemId: number, quantity: number) {
    if (quantity < 1) return;
    const fd = new FormData();
    fd.append("itemId", String(itemId));
    fd.append("quantity", String(quantity));
    await updateCartQuantity(fd);
    setCart((c) => c.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
  }

  async function checkout() {
    setLoading(true);
    setErr("");
    try {
      const res = await createCheckoutSession();
      if (res.error) { setErr(res.error); return; }
      if (res.url) window.location.href = res.url;
    } catch (e) {
      console.error("Checkout fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex justify-center p-4 sm:p-6 md:p-16">
      <div className="w-full max-w-xl space-y-6">
        <div className="t-card border p-4">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1 t-text">Warenkorb</h1>
          <a href="/shop" className="text-xs t-muted uppercase tracking-widest hover:t-text transition">← Weiter shoppen</a>
        </div>

        {cart.length === 0 ? (
          <div className="bg-black/80 border border-zinc-700 p-6 text-center">
            <p className="text-xs text-zinc-400 uppercase tracking-widest">Dein Warenkorb ist leer.</p>
            <a href="/shop" className="mt-4 inline-block border border-zinc-600 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-400 hover:border-white hover:text-white transition">
              Zum Shop →
            </a>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="t-card border t-border p-4 flex gap-4 items-center relative">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover border t-border-s shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold uppercase tracking-widest t-text truncate">{item.name}</p>
                    <p className="text-xs t-muted">{[item.colorName, item.variantLabel, item.dropLabel].filter(Boolean).join(" · ") || null}</p>
                    <p className="text-xs t-muted mt-1">{(item.unitPriceCents / 100).toFixed(2)} €</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="border t-border w-7 h-7 flex items-center justify-center hover:bg-white hover:text-black transition t-text font-bold">−</button>
                    <span className="w-6 text-center text-sm t-text">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="border t-border w-7 h-7 flex items-center justify-center hover:bg-white hover:text-black transition t-text font-bold">+</button>
                  </div>
                  <button onClick={() => remove(item.id)}
                    className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-red-400 transition text-xs border border-zinc-700 hover:border-red-500">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="t-card border p-4 flex justify-between items-center">
              <span className="text-xs t-muted uppercase tracking-widest">Gesamt (zzgl. Versand)</span>
              <span className="text-xl font-black t-text">{(total / 100).toFixed(2)} €</span>
            </div>
            <p className="text-[10px] uppercase tracking-widest -mt-2 bg-black/80 border border-zinc-800 px-3 py-2 t-faint">
              Versandkosten werden im nächsten Schritt bei Stripe berechnet.
            </p>

            {err && <p className="text-xs text-red-500 uppercase tracking-widest">{err}</p>}

            <button onClick={checkout} disabled={loading}
              className="w-full t-btn-primary py-4 font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50">
              {loading ? "..." : "Zur Kasse →"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
