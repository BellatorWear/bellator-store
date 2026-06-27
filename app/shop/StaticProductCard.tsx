"use client";
import React, { useState, useEffect } from "react";
import { handleAction } from "../actions";
import { addToCart } from "../cart";
import PriceDisplay from "./components/PriceDisplay";
import RedeemCodeButton from "./components/RedeemCodeButton";

type CountdownData = { enabled: boolean; targetDate: string; label: string };

function Countdown({ initialConfig }: { initialConfig: CountdownData }) {
  const [config, setConfig] = useState<CountdownData>(initialConfig);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  // Erlaubt dem Admin-Panel (gleicher Tab/Browser), eine Live-Vorschau zu
  // senden ohne neu laden zu müssen. Der eigentliche, für ALLE Besucher
  // gültige Wert kommt aber als initialConfig vom Server (siteSettings),
  // nicht mehr aus localStorage - daher zeigt ein komplett neuer Tab jetzt
  // korrekt den vom Admin gespeicherten Wert statt immer wieder 14 Tage.
  useEffect(() => {
    function onPreview(e: Event) {
      const detail = (e as CustomEvent<CountdownData>).detail;
      if (detail) setConfig(detail);
    }
    window.addEventListener("bellator-countdown-preview", onPreview);
    return () => window.removeEventListener("bellator-countdown-preview", onPreview);
  }, []);

  useEffect(() => {
    if (!config?.enabled) return;
    function calc() {
      const diff = new Date(config.targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    }
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [config]);

  if (!config?.enabled) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="w-full max-w-[380px] bg-black/85 border border-zinc-800 p-4 sm:p-5 text-center">
      <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 mb-3">{config.label}</p>
      <div className="flex justify-center gap-3 sm:gap-5">
        {[["TAGE", timeLeft.d], ["STD", timeLeft.h], ["MIN", timeLeft.m], ["SEK", timeLeft.s]].map(([label, val]) => {
          const padded = pad(Number(val));
          return (
            <div key={label as string} className="flex flex-col items-center">
              <span className="text-3xl sm:text-5xl font-black tabular-nums leading-none" style={{ fontFamily: "'Courier New', monospace" }}>
                <span className="text-red-500">{padded[0]}</span>
                <span className="text-zinc-300">{padded[1]}</span>
              </span>
              <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 mt-1">{label as string}</span>
            </div>
          );
        })}
      </div>
      {/* Mobile: Rabattcode-Button direkt unter dem Countdown (Desktop hat ihn im Header oben links) */}
      <div className="md:hidden mt-4">
        <RedeemCodeButton variant="block" />
      </div>
    </div>
  );
}

type DbProduct = {
  id: number;
  priceCents: number;
  compareAtPriceCents: number | null;
  dropLabel: string | null;
  dropLimit: number | null;
  soldCount: number | null;
} | null;

export default function StaticProductCard({
  countdown,
  dbProduct,
}: {
  countdown: CountdownData;
  dbProduct: DbProduct;
}) {
  const stock = dbProduct?.dropLimit != null ? Math.max(0, dbProduct.dropLimit - (dbProduct.soldCount ?? 0)) : 10;
  const soldOut = dbProduct?.dropLimit != null && stock <= 0;
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [email, setEmail] = useState("");
  const [newsletterMsg, setNewsletterMsg] = useState("");
  const [cartMsg, setCartMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  async function subscribeNewsletter(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("actionType", "subscribeNewsletter");
      fd.append("email", email);
      const res = await handleAction(fd);
      if (res.success) setNewsletterMsg("Du wirst beim nächsten Drop benachrichtigt!");
      else setNewsletterMsg(res.error || "Fehler.");
    } catch (e) {
      console.error("Newsletter Anmeldung fehlgeschlagen:", e);
      setNewsletterMsg("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart() {
    if (cartLoading) return;
    setCartLoading(true);
    setCartMsg("");
    try {
      const fd = new FormData();
      fd.append("productId", "1");
      fd.append("quantity", "1");
      const res = await addToCart(fd);
      if (res.error) setCartMsg(res.error);
      else { setCartMsg("✓ Zum Warenkorb hinzugefügt!"); setTimeout(() => setCartMsg(""), 3000); }
    } catch (e) {
      console.error("Add to cart fehlgeschlagen:", e);
      setCartMsg("Fehler. Bitte nochmal versuchen.");
    } finally {
      setCartLoading(false);
    }
  }

  const product = { id: "basic-bellator-001", name: "Basic Bellator Shirt", tagline: "Bellators First Drop" };
  const priceCents = dbProduct?.priceCents ?? 3500;
  const compareAt = dbProduct?.compareAtPriceCents ?? null;

  return (
    <div className="flex flex-col items-center gap-5 w-full px-4 pt-2 pb-8">
      <Countdown initialConfig={countdown} />

      <div className="relative w-full max-w-[380px] t-card border-[3px] t-border p-5 sm:p-6" style={{ boxShadow: "8px 8px 0px 0px var(--shadow)" }}>
        <div className="flex justify-between items-center mb-3 text-[10px] uppercase tracking-widest">
          <span className="border border-zinc-600 px-2 py-1 t-muted font-bold">{dbProduct?.dropLabel ?? "Drop #1"}</span>
          {soldOut ? (
            <span className="border border-red-700 px-2 py-1 text-red-400 font-bold">Ausverkauft</span>
          ) : (
            <span className="border border-green-800 px-2 py-1 text-green-400 font-bold">Noch {stock} Stück</span>
          )}
        </div>

        {soldOut && (
          <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className="absolute w-[200%] bg-red-600 text-white font-black text-3xl tracking-widest text-center py-4 rotate-[-35deg]" style={{ top: "38%" }}>SOLD OUT</div>
            <div className="absolute inset-0 bg-black/60" />
          </div>
        )}

        <div className="t-bg mb-4 overflow-hidden border t-border-s">
          <img src="/blackshirt-mockup.webp" alt={product.name} className="w-full h-auto block grayscale hover:grayscale-0 transition-all duration-300" />
        </div>

        <h3 className="text-[0.6rem] uppercase tracking-[0.4em] t-muted mb-1">{product.tagline}</h3>
        <h1 className="text-2xl sm:text-3xl font-black uppercase t-text mb-2 leading-tight">{product.name}</h1>
        <div className="mb-3">
          <PriceDisplay priceCents={priceCents} compareAtPriceCents={compareAt} />
        </div>

        {cartMsg && <p className={`text-[10px] uppercase tracking-widest mb-2 ${cartMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{cartMsg}</p>}

        {soldOut ? (
          <button onClick={() => setShowNewsletter(true)}
            className="w-full py-4 text-center uppercase font-black tracking-[0.2em] border-[3px] border-red-500 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-200 text-sm">
            Next Drop beitreten
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <a href={`/shop/product/${product.id}`}
              className="block w-full py-3 text-center uppercase font-black tracking-[0.2em] border-[3px] t-border t-text hover:bg-white hover:text-black transition-all duration-200 text-sm">
              Details ansehen
            </a>
            <button onClick={handleAddToCart} disabled={cartLoading}
              className="w-full py-3 uppercase font-black tracking-[0.2em] border-[3px] border-zinc-600 t-muted hover:border-white hover:t-text transition-all duration-200 text-sm disabled:opacity-50">
              {cartLoading ? "..." : "Zum Warenkorb hinzufügen"}
            </button>
          </div>
        )}
      </div>

      <a href="https://discord.gg/T4RwVJRyRp" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 border t-border px-5 py-3 t-card hover:border-[#5865F2] hover:text-[#5865F2] transition-all duration-200 text-xs font-bold uppercase tracking-widest t-text">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.102 18.079.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
        Discord beitreten
      </a>

      {showNewsletter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm t-card border p-6 sm:p-8">
            <h2 className="text-xl font-black uppercase tracking-tighter mb-2 t-text">Next Drop</h2>
            <p className="text-xs t-muted uppercase tracking-widest mb-6">Trag dich ein und wir benachrichtigen dich sobald der nächste Drop live ist.</p>
            {newsletterMsg ? (
              <p className="text-green-400 text-sm text-center uppercase tracking-widest">{newsletterMsg}</p>
            ) : (
              <form onSubmit={subscribeNewsletter} className="space-y-4">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-MAIL" required
                  className="w-full t-input border-b p-2 text-center uppercase tracking-widest text-sm" />
                <button type="submit" disabled={loading}
                  className="w-full t-btn-primary py-3 font-black text-xs uppercase tracking-widest transition-all duration-200 disabled:opacity-50">
                  {loading ? "..." : "Benachrichtigen"}
                </button>
              </form>
            )}
            <button onClick={() => setShowNewsletter(false)} className="mt-4 w-full text-[10px] t-faint uppercase tracking-widest hover:t-text transition">Schließen</button>
          </div>
        </div>
      )}
    </div>
  );
}
