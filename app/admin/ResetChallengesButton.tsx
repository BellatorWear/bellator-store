"use client";
import { useState } from "react";
import { resetAllChallengesAndPoints } from "./actions";

const CONFIRM_PHRASE = "RESET BESTÄTIGEN";

export default function ResetChallengesButton() {
  const [input, setInput] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function handleReset() {
    if (input !== CONFIRM_PHRASE || pending) return;
    setPending(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("confirmation", input);
      const res = await resetAllChallengesAndPoints(fd);
      if (res?.error) {
        setResult({ text: res.error, type: "error" });
      } else {
        setResult({ text: res?.message ?? "Erledigt.", type: "success" });
        setShowConfirm(false);
        setInput("");
      }
    } catch (e) {
      console.error("Reset fehlgeschlagen:", e);
      setResult({ text: "Unerwarteter Fehler - siehe Server-Log.", type: "error" });
    } finally {
      setPending(false);
    }
  }

  if (!showConfirm) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="border border-red-800 text-red-500 hover:bg-red-950 px-4 py-2.5 text-xs uppercase tracking-widest font-black transition-all"
        >
          Challenges & Punkte für alle User zurücksetzen
        </button>
        {result && (
          <p className={`text-[10px] uppercase tracking-widest ${result.type === "success" ? "text-green-500" : "text-red-500"}`}>
            {result.text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="border border-red-800 bg-red-950/30 p-4 space-y-3">
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest">⚠ Nicht rückgängig zu machen</p>
      <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
        <li>Löscht ALLE eingelösten Prämien aller User (auch bereits verschickte physische Prämien - der Merch bleibt natürlich verschickt, nur der DB-Eintrag ist weg)</li>
        <li>Setzt Punkte und Challenge-Fortschritt für ALLE User zurück</li>
        <li>Prüft danach automatisch neu, was aus echten Daten ableitbar ist (Bestellungen, Reviews, Newsletter, etc.)</li>
        <li>Manuelle/einmalige Challenges (z.B. Admin-Klick &quot;erledigt&quot;) und Discord-Beitritt können NICHT automatisch wiederhergestellt werden</li>
      </ul>
      <p className="text-[11px] text-zinc-400">
        Tippe zur Bestätigung exakt <span className="text-white font-mono">{CONFIRM_PHRASE}</span> ein:
      </p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={CONFIRM_PHRASE}
        className="w-full bg-black border border-red-800 p-2 text-sm text-white font-mono"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={input !== CONFIRM_PHRASE || pending}
          className="flex-1 bg-red-700 hover:bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-2.5 text-xs uppercase tracking-widest font-black transition-all"
        >
          {pending ? "Läuft..." : "Endgültig zurücksetzen"}
        </button>
        <button
          type="button"
          onClick={() => { setShowConfirm(false); setInput(""); }}
          disabled={pending}
          className="flex-1 t-btn-outline py-2.5 text-xs uppercase tracking-widest font-black transition-all"
        >
          Abbrechen
        </button>
      </div>
      {result && (
        <p className={`text-[10px] uppercase tracking-widest ${result.type === "success" ? "text-green-500" : "text-red-500"}`}>
          {result.text}
        </p>
      )}
    </div>
  );
}
