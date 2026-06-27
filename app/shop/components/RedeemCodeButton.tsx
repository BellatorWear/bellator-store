"use client";
import { useState } from "react";
import { redeemDiscountCode } from "@/app/cart";

export default function RedeemCodeButton({ variant = "inline" }: { variant?: "inline" | "block" }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("code", code.trim());
      const res = await redeemDiscountCode(fd);
      if (res.error) setMsg({ text: res.error, type: "error" });
      else setMsg({ text: `✓ Code aktiv: -${res.percentOff}% beim nächsten Checkout`, type: "success" });
    } catch (err) {
      console.error("Rabattcode einlösen fehlgeschlagen:", err);
      setMsg({ text: "Fehler. Bitte nochmal versuchen.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "block"
            ? "w-full border t-border py-2.5 text-[10px] sm:text-xs uppercase tracking-widest font-bold t-text hover:bg-white hover:text-black transition-all"
            : "text-[11px] uppercase tracking-widest font-bold t-text border t-border px-3 py-1.5 hover:bg-white hover:text-black transition-all"
        }
      >
        Rabattcode einlösen
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm t-card border p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black uppercase tracking-tighter mb-2 t-text">Rabattcode einlösen</h2>
            <p className="text-xs t-muted uppercase tracking-widest mb-6">Wird automatisch beim nächsten Checkout angewendet.</p>
            <form onSubmit={submit} className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CODE"
                maxLength={20}
                className="w-full t-input border-b p-2 text-center uppercase tracking-widest text-sm"
              />
              {msg && (
                <p className={`text-[10px] uppercase tracking-widest text-center ${msg.type === "error" ? "text-red-500" : "text-green-500"}`}>
                  {msg.text}
                </p>
              )}
              <button type="submit" disabled={loading}
                className="w-full t-btn-primary py-3 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                {loading ? "..." : "Einlösen"}
              </button>
            </form>
            <button onClick={() => setOpen(false)} className="mt-4 w-full text-[10px] t-faint uppercase tracking-widest hover:t-text transition">
              Schließen
            </button>
          </div>
        </div>
      )}
    </>
  );
}
