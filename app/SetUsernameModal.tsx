"use client";
import { useState } from "react";
import { handleAction } from "@/app/actions";

export default function SetUsernameModal({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("actionType", "setUsername");
      fd.append("username", username);
      const res = await handleAction(fd);
      if (res.error) {
        setErr(typeof res.error === "string" ? res.error : "Fehler.");
        return;
      }
      onDone();
    } catch (e) {
      console.error("Username setzen fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-4 text-white">
      <div className="w-full max-w-sm border border-zinc-600 bg-black p-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Bellator.</h1>
        <h2 className="text-lg font-black uppercase tracking-tighter mb-2">Benutzername wählen</h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">
          Fast fertig! Wähle einen eindeutigen Benutzernamen.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="BENUTZERNAME"
            required
            maxLength={20}
            className="w-full bg-zinc-900 border-b border-zinc-600 p-2 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white"
          />
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest text-center">
            3-20 Zeichen · Buchstaben, Zahlen, Punkt, Unterstrich
          </p>
          {err && (
            <p className="text-red-500 text-[10px] uppercase tracking-widest text-center">{err}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-zinc-500 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50"
          >
            {loading ? "..." : "Speichern & weiter"}
          </button>
        </form>
        <p className="text-[9px] text-zinc-600 uppercase tracking-widest text-center mt-4">
          Änderbar alle 7 Tage in den Einstellungen
        </p>
      </div>
    </main>
  );
}
