"use client";
import { useState } from "react";
import { checkBlobConnection } from "./actions";

export default function BlobStatus() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function check() {
    setLoading(true);
    setResult(null);
    try {
      const res = await checkBlobConnection();
      if (res?.error) {
        setResult({ success: false, message: res.error });
      } else {
        setResult({ success: !!res.success, message: res.message ?? "" });
      }
    } catch (e) {
      console.error("Blob-Check fehlgeschlagen:", e);
      setResult({ success: false, message: "Fehler beim Prüfen." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Prüft direkt, ob die Verbindung zu Vercel Blob funktioniert - bevor man es erst beim
        Produkt-Anlegen merkt.
      </p>
      <button onClick={check} disabled={loading}
        className="border border-zinc-500 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50">
        {loading ? "Prüfe..." : "Verbindung testen"}
      </button>
      {result && (
        <p className={`text-[10px] uppercase tracking-widest leading-relaxed ${result.success ? "text-green-500" : "text-red-500"}`}>
          {result.success ? "✓ " : "✕ "}{result.message}
        </p>
      )}
    </div>
  );
}
