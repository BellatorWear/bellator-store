"use client";
import { useState } from "react";
import { handleAction } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function RedeemRewardButton({ rewardId, disabled }: { rewardId: number; disabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<{
    code?: string;
    message?: string;
    error?: string;
    copied?: boolean;
  }>({});
  const router = useRouter();

  async function submit() {
    setLoading(true);
    setState({});
    const fd = new FormData();
    fd.append("actionType", "redeemReward");
    fd.append("rewardId", String(rewardId));
    try {
      const res = await handleAction(fd);
      if (res.error) {
        setState({ error: res.error });
        return;
      }
      setState({ code: res.code ?? undefined, message: res.message ?? "Eingelöst!" });
      router.refresh();
    } catch (e) {
      console.error("Prämie einlösen fehlgeschlagen:", e);
      setState({ error: "Fehler. Bitte nochmal versuchen." });
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!state.code) return;
    try {
      await navigator.clipboard.writeText(state.code);
      setState((prev) => ({ ...prev, copied: true }));
      setTimeout(() => setState((prev) => ({ ...prev, copied: false })), 2000);
    } catch {
      // Fallback: manuell markieren
      const el = document.querySelector("#reward-code-display");
      if (el instanceof HTMLElement) {
        const range = document.createRange();
        range.selectNode(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  }

  if (state.code) {
    return (
      <div className="space-y-3 border border-zinc-700 p-4 bg-black/60">
        <p className="text-[10px] text-green-500 uppercase tracking-widest">✓ {state.message} eingelöst!</p>
        <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Dein Code (wurde auch per Email verschickt)</p>
        <div className="flex gap-2 items-center">
          <span
            id="reward-code-display"
            className="flex-1 border-2 border-white bg-black px-4 py-3 font-black text-white tracking-[0.25em] text-center text-sm select-all"
          >
            {state.code}
          </span>
          <button
            onClick={copy}
            className="border border-zinc-600 px-3 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition whitespace-nowrap"
          >
            {state.copied ? "✓ Kopiert" : "Kopieren"}
          </button>
        </div>
        <p className="text-[9px] text-zinc-600">Beim Checkout eingeben um den Rabatt zu erhalten.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {state.error && <p className="text-[10px] text-red-500 uppercase tracking-widest">{state.error}</p>}
      <button onClick={submit} disabled={loading || disabled}
        className="border t-border px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition disabled:opacity-40 t-text">
        {loading ? "..." : disabled ? "Nicht genug Punkte" : "Einlösen"}
      </button>
    </div>
  );
}
