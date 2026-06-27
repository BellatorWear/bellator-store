"use client";
import { useState } from "react";
import { saveCountdownSetting } from "./actions";

type CountdownData = { enabled: boolean; targetDate: string; label: string };

export default function CountdownConfig({ initial }: { initial: CountdownData }) {
  const [data, setData] = useState<CountdownData>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  function broadcastPreview(next: CountdownData) {
    // Live-Vorschau im selben Browser/Tab, ohne neu zu laden - die
    // tatsächlich für ALLE Besucher gültige Speicherung passiert erst
    // beim Klick auf "Speichern" (siehe save()).
    window.dispatchEvent(new CustomEvent("bellator-countdown-preview", { detail: next }));
  }

  function update(patch: Partial<CountdownData>) {
    const next = { ...data, ...patch };
    setData(next);
    broadcastPreview(next);
  }

  async function save() {
    setSaving(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("enabled", String(data.enabled));
      fd.append("targetDate", data.targetDate);
      fd.append("label", data.label);
      const res = await saveCountdownSetting(fd);
      if (res?.error) {
        setErr(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Countdown speichern fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
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
            onClick={() => update({ enabled: !data.enabled })}
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
            onChange={(e) => update({ targetDate: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white hover:border-zinc-500 focus:border-white outline-none transition"
          />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Label</label>
          <input
            type="text"
            value={data.label}
            onChange={(e) => update({ label: e.target.value })}
            placeholder="Nächster Drop in"
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 hover:border-zinc-500 focus:border-white outline-none transition"
          />
        </div>
      </div>

      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="border border-zinc-500 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-50"
        >
          {saving ? "..." : "Speichern"}
        </button>
        {saved && <span className="text-[10px] text-green-500 uppercase tracking-widest">✓ Gespeichert</span>}
      </div>
      <p className="text-[9px] text-zinc-600">
        Wird jetzt zentral gespeichert und gilt für ALLE Besucher (vorher nur lokal in deinem Browser).
      </p>
    </section>
  );
}
