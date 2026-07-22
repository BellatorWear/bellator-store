"use client";
import { useState } from "react";
import { exportUserData } from "@/app/utils/gdprExport";

export default function GdprExportButton() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleExport() {
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      const res = await exportUserData();
      if (res?.error) {
        setErr(res.error);
        return;
      }
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bellator-datenexport-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Datenexport fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="t-btn-outline px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
      >
        {loading ? "Wird erstellt..." : "Meine Daten herunterladen"}
      </button>
      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest mt-2">{err}</p>}
    </div>
  );
}
