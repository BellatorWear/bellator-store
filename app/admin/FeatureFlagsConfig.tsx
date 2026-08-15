"use client";
import { useState } from "react";
import { toggleFeatureFlag } from "./actions";
import { FEATURE_FLAGS, type FeatureFlagKey } from "@/app/utils/featureFlags";

export default function FeatureFlagsConfig({ initial }: { initial: Record<FeatureFlagKey, boolean> }) {
  const [flags, setFlags] = useState(initial);
  const [pending, setPending] = useState<FeatureFlagKey | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function toggle(flag: FeatureFlagKey) {
    const next = !flags[flag];
    setPending(flag);
    setMsg(null);
    try {
      const res = await toggleFeatureFlag(flag, next);
      if (res?.error) {
        setMsg({ text: res.error, type: "error" });
      } else {
        setFlags((f) => ({ ...f, [flag]: next }));
        setMsg({ text: "✓ Gespeichert.", type: "success" });
      }
    } catch (e) {
      console.error("Feature-Flag umschalten fehlgeschlagen:", e);
      setMsg({ text: "Fehler. Bitte nochmal versuchen.", type: "error" });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Kill-Switch für nicht-kritische Features. Bei Traffic-Spitzen oder
        Problemen mit der Datenbank hier gezielt abschalten, um Last zu
        reduzieren - Checkout, Login und Warenkorb sind hiervon bewusst
        NICHT betroffen und laufen immer weiter.
      </p>
      {(Object.keys(FEATURE_FLAGS) as FeatureFlagKey[]).map((key) => (
        <div key={key} className="flex justify-between items-center border t-border-s px-3 py-2.5">
          <span className="text-xs uppercase tracking-widest">{FEATURE_FLAGS[key].label}</span>
          <button type="button" disabled={pending === key} onClick={() => toggle(key)}
            className={`relative w-10 h-5 border transition-all disabled:opacity-50 ${flags[key] ? "border-white bg-white" : "border-zinc-600 bg-zinc-900"}`}>
            <span className={`absolute top-0.5 w-4 h-4 transition-all ${flags[key] ? "right-0.5 bg-black" : "left-0.5 bg-white"}`} />
          </button>
        </div>
      ))}
      {msg && (
        <p className={`text-[10px] uppercase tracking-widest ${msg.type === "success" ? "text-green-500" : "text-red-500"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
