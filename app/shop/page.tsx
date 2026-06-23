"use client";
import React, { useState } from "react";
import { handleAction } from "../actions";

export default function ShopPage() {
  const [soldOut] = useState(false); // Aus DB holen sobald Checkout fertig
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function subscribeNewsletter(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.append("actionType", "subscribeNewsletter");
    fd.append("email", email);
    const res = await handleAction(fd);
    setLoading(false);
    if (res.success) setMsg("Du wirst beim nächsten Drop benachrichtigt!");
    else setMsg(res.error || "Fehler.");
  }

  const product = {
    id: "basic-bellator-001",
    name: "Basic Bellator Shirt",
    tagline: "Bellators First Drop",
    price: "35.00 EUR",
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-6 md:p-24 gap-10">
      {/* Key Facts Banner */}
      <div className="flex flex-wrap justify-center gap-6 text-[10px] uppercase tracking-[0.2em] t-muted">
        <span className="border t-border px-4 py-2 t-card font-bold text-yellow-400 border-yellow-600">240g Heavy Cotton</span>
        <span className="border t-border px-4 py-2 t-card font-bold">Oversized Fit</span>
        <span className="border border-red-700 px-4 py-2 t-card font-bold text-red-400">Strictly Limited — 10 Pieces</span>
      </div>

      {/* Product Card */}
      <div className="relative w-full max-w-[400px] t-card border-[3px] t-border p-6"
        style={{ boxShadow: "10px 10px 0px 0px var(--shadow)" }}>

        {/* SOLD OUT Overlay */}
        {soldOut && (
          <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className="absolute w-[200%] bg-red-600 text-white font-black text-3xl tracking-widest text-center py-4 rotate-[-35deg]"
              style={{ top: "38%" }}>
              SOLD OUT
            </div>
            <div className="absolute inset-0 bg-black/60" />
          </div>
        )}

        <div className="t-bg mb-6 overflow-hidden border t-border-s">
          <img
            src="/blackshirt-mockup.png"
            alt={product.name}
            className="w-full h-auto block grayscale hover:grayscale-0 transition-all duration-300"
          />
        </div>

        <h3 className="text-[0.6rem] uppercase tracking-[0.4em] t-muted mb-1">{product.tagline}</h3>
        <h1 className="text-3xl font-black uppercase t-text mb-2 leading-tight">{product.name}</h1>
        <p className="text-xl font-black t-text mb-4 border-l-4 border-red-600 pl-3">{product.price}</p>

        {soldOut ? (
          <button
            onClick={() => setShowNewsletter(true)}
            className="block w-full py-4 mt-2 text-center uppercase font-black tracking-[0.2em] border-[3px] border-red-500 text-red-400 hover:bg-red-600 hover:text-white transition-all"
          >
            Next Drop beitreten
          </button>
        ) : (
          <a
            href={`/shop/product/${product.id}`}
            className="block w-full py-4 mt-2 text-center uppercase font-black tracking-[0.2em] border-[3px] t-border t-text hover:bg-white hover:text-black transition-all"
          >
            Details ansehen
          </a>
        )}
      </div>

      {/* Discord Link */}
      <a
        href="https://discord.gg/T4RwVJRyRp"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 border t-border px-6 py-3 t-card hover:border-[#5865F2] hover:text-[#5865F2] transition-all text-sm font-bold uppercase tracking-widest t-text"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.102 18.079.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
        </svg>
        Discord beitreten
      </a>

      {/* Newsletter Modal */}
      {showNewsletter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm t-card border p-8">
            <h2 className="text-xl font-black uppercase tracking-tighter mb-2 t-text">Next Drop</h2>
            <p className="text-xs t-muted uppercase tracking-widest mb-6">
              Trag dich ein und wir benachrichtigen dich sobald der nächste Drop live ist.
            </p>
            {msg ? (
              <p className="text-green-400 text-sm text-center uppercase tracking-widest">{msg}</p>
            ) : (
              <form onSubmit={subscribeNewsletter} className="space-y-4">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="E-MAIL" required
                  className="w-full t-input border-b p-2 text-center uppercase tracking-widest text-sm" />
                <button type="submit" disabled={loading}
                  className="w-full t-btn-primary py-3 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                  {loading ? "..." : "Benachrichtigen"}
                </button>
              </form>
            )}
            <button onClick={() => setShowNewsletter(false)}
              className="mt-4 w-full text-[10px] t-faint uppercase tracking-widest hover:t-text transition">
              Schließen
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
