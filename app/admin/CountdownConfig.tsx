"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "bellator_countdown";

type CountdownData = {
  enabled: boolean;
  targetDate: string; // ISO string
  label: string;
};

function getDefaults(): CountdownData {
  return {
    enabled: true,
    targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    label: "Nächster Drop in",
  };
}

export default function CountdownConfig() {
  const [data, setData] = useState<CountdownData>(getDefaults());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setData(JSON.parse(stored));
    } catch {}
  }, []);

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Broadcast zu anderen Tabs/Komponenten
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify(data) }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  }

  return (
    <section className="border border-zinc-700 p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Countdown</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
            {data.enabled ? "Aktiv" : "Deaktiviert"}
          </span>
          <button
            type="button"
            onClick={() => setData(d => ({ ...d, enabled: !d.enabled }))}
            className={`relative w-10 h-5 border transition-all ${data.enabled ? "border-white bg-white" : "border-zinc-600 bg-zinc-900"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 transition-all ${data.enabled ? "right-0.5 bg-black" : "left-0.5 bg-white"}`} />
          </button>
        </label>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Zieldatum & Uhrzeit</label>
          <input
            type="datetime-local"
            value={data.targetDate}
            onChange={e => setData(d => ({ ...d, targetDate: e.target.value }))}
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white hover:border-zinc-500 focus:border-white outline-none transition"
          />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Label</label>
          <input
            type="text"
            value={data.label}
            onChange={e => setData(d => ({ ...d, label: e.target.value }))}
            placeholder="Nächster Drop in"
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 hover:border-zinc-500 focus:border-white outline-none transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="border border-zinc-500 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-200"
        >
          Speichern
        </button>
        {saved && <span className="text-[10px] text-green-500 uppercase tracking-widest">✓ Gespeichert</span>}
      </div>
      <p className="text-[9px] text-zinc-600">
        Der Countdown wird auf der Shop-Hauptseite angezeigt wenn aktiviert. Einstellungen werden im Browser gespeichert.
      </p>
    </section>
  );
}
