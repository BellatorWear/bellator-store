"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { redeemCode } from "@/app/cart";

export default function RedeemCodeButton({ variant = "inline" }: { variant?: "inline" | "block" }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Portal braucht document.body, das erst nach dem Mounten im Browser
  // existiert (nicht beim Server-Rendering).
  useEffect(() => setMounted(true), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("code", code.trim());
      const res = await redeemCode(fd);
      if (res.error) {
        setMsg({ text: res.error, type: "error" });
      } else if (res.type === "prerelease") {
        setMsg({ text: "✓ Pre-Release-Zugang freigeschaltet! Lade die Shop-Seite neu, um die Produkte zu sehen.", type: "success" });
      } else {
        setMsg({ text: `✓ Code aktiv: -${res.percentOff}% beim nächsten Checkout`, type: "success" });
      }
    } catch (err) {
      console.error("Code einlösen fehlgeschlagen:", err);
      setMsg({ text: "Fehler. Bitte nochmal versuchen.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // Wichtig: per createPortal direkt in document.body gerendert, NICHT
  // verschachtelt im Header. Der Header hat selbst einen eigenen
  // Stacking-Context (position:relative + z-index) - ein fixed-Modal DARIN
  // bleibt visuell in genau diesem Context "gefangen" und kann von anderen
  // Overlays auf Root-Ebene (z.B. dem Newsletter/Push-Popup) komplett
  // verdeckt werden, auch mit höherem z-index. Per Portal umgeht man das.
  const modal = open && mounted ? createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-sm t-card border p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black uppercase tracking-tighter mb-2 t-text">Code eingeben</h2>
        <p className="text-xs t-muted uppercase tracking-widest mb-6">Rabattcode oder Pre-Release-Zugangscode.</p>
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
    </div>,
    document.body,
  ) : null;

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
        Code eingeben
      </button>
      {modal}
    </>
  );
}
