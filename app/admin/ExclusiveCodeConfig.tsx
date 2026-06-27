"use client";
import { useState } from "react";
import { saveExclusiveCodeSetting } from "./actions";

type Setting = { enabled: boolean; firstNOrders: number; percentOff: number; code?: string };

export default function ExclusiveCodeConfig({ initial }: { initial: Setting }) {
  const [data, setData] = useState<Setting>({ code: "", ...initial });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("enabled", String(data.enabled));
      fd.append("firstNOrders", String(data.firstNOrders));
      fd.append("percentOff", String(data.percentOff));
      fd.append("code", data.code ?? "");
      const res = await saveExclusiveCodeSetting(fd);
      if (res?.error) setMsg({ text: res.error, type: "error" });
      else setMsg({ text: "✓ Gespeichert. Code ist jetzt bei Stripe aktiv.", type: "success" });
    } catch (e) {
      console.error("Exklusiver Code speichern fehlgeschlagen:", e);
      setMsg({ text: "Fehler. Bitte nochmal versuchen.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="border border-zinc-700 p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Exklusive Erstbesteller-Codes</h2>
        <button type="button" onClick={() => setData((d) => ({ ...d, enabled: !d.enabled }))}
          className={`relative w-10 h-5 border transition-all ${data.enabled ? "border-white bg-white" : "border-zinc-600 bg-zinc-900"}`}>
          <span className={`absolute top-0.5 w-4 h-4 transition-all ${data.enabled ? "right-0.5 bg-black" : "left-0.5 bg-white"}`} />
        </button>
      </div>
      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Ein Code, der nur für die ersten N Bestellungen insgesamt funktioniert (danach automatisch
        gesperrt - das übernimmt Stripe direkt über das Redemption-Limit des Promotion Codes).
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Code</label>
          <input value={data.code} onChange={(e) => setData((d) => ({ ...d, code: e.target.value.toUpperCase() }))}
            placeholder="z.B. FIRST50" maxLength={20}
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white uppercase tracking-widest" />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Rabatt (%)</label>
          <input value={data.percentOff} onChange={(e) => setData((d) => ({ ...d, percentOff: parseInt(e.target.value) || 0 }))}
            type="number" min="1" max="90"
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Gültig für die ersten ... Bestellungen</label>
        <input value={data.firstNOrders} onChange={(e) => setData((d) => ({ ...d, firstNOrders: parseInt(e.target.value) || 0 }))}
          type="number" min="1"
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
      </div>
      {msg && <p className={`text-[10px] uppercase tracking-widest ${msg.type === "error" ? "text-red-500" : "text-green-500"}`}>{msg.text}</p>}
      <button onClick={save} disabled={saving}
        className="border border-zinc-500 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50">
        {saving ? "..." : "Speichern"}
      </button>
      <p className="text-[9px] text-zinc-600">
        Hinweis: Sobald ein Code einmal bei Stripe angelegt ist, lässt sich sein Verwendungslimit dort
        nicht mehr ändern (Stripe-Einschränkung) - für ein neues Limit am besten einen neuen Code wählen.
      </p>
    </section>
  );
}
