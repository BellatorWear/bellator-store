"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPreReleaseCode, deletePreReleaseCode } from "./actions";
import ConfirmDialog from "./ConfirmDialog";

type Code = { id: number; code: string; maxUsesPerAccount: number | null; redemptionCount: number };

export default function PreReleaseCodeManager({ codes }: { codes: Code[] }) {
  const [code, setCode] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("code", code);
      fd.append("maxUsesPerAccount", maxUses);
      const res = await createPreReleaseCode(fd);
      if (res?.error) {
        setMsg({ text: res.error, type: "error" });
        return;
      }
      setMsg({ text: "✓ Code erstellt.", type: "success" });
      setCode("");
      setMaxUses("1");
      router.refresh();
    } catch (err) {
      console.error("Pre-Release-Code erstellen fehlgeschlagen:", err);
      setMsg({ text: "Fehler. Bitte nochmal versuchen.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const fd = new FormData();
      fd.append("id", String(confirmDeleteId));
      await deletePreReleaseCode(fd);
      router.refresh();
    } catch (err) {
      console.error("Pre-Release-Code löschen fehlgeschlagen:", err);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Mit diesem Code kann sich ein eingeloggter User über den &quot;Code eingeben&quot;-Button (oben
        links im Shop-Header) frühzeitig Zugriff auf Pre-Release-Produkte freischalten - sichtbar, bevor
        deren Drop-Datum erreicht ist. Welche Produkte das sind, legt man pro Produkt fest (Haken
        &quot;Pre-Release&quot; beim Anlegen/Bearbeiten).
      </p>

      <form onSubmit={submit} className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Code</label>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="z.B. VIPACCESS"
            maxLength={30} className="bg-zinc-900 border border-zinc-700 p-2 text-sm text-white uppercase tracking-widest" />
        </div>
        <div>
          <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Max. Nutzungen / Account</label>
          <input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} type="number" min="1"
            className="w-32 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
        </div>
        <button type="submit" disabled={loading}
          className="border border-zinc-500 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50">
          {loading ? "..." : "Code erstellen"}
        </button>
      </form>

      {msg && <p className={`text-[10px] uppercase tracking-widest ${msg.type === "error" ? "text-red-500" : "text-green-500"}`}>{msg.text}</p>}

      <div className="space-y-2">
        {codes.length === 0 && <p className="text-xs text-zinc-600">Noch keine Pre-Release-Codes erstellt.</p>}
        {codes.map((c) => (
          <div key={c.id} className="flex justify-between items-center border border-zinc-800 px-3 py-2">
            <div>
              <span className="text-sm font-bold text-white tracking-widest">{c.code}</span>
              <span className="text-[10px] text-zinc-500 ml-3">
                Max. {c.maxUsesPerAccount ?? "∞"} / Account · {c.redemptionCount} Einlösung{c.redemptionCount === 1 ? "" : "en"} gesamt
              </span>
            </div>
            <button onClick={() => setConfirmDeleteId(c.id)}
              className="text-[10px] text-red-500 uppercase tracking-widest hover:text-red-400 transition">
              Löschen
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Code löschen?"
        message="Dieser Pre-Release-Code wird ungültig. Bereits gewährter Zugang bleibt bestehen, der Code kann aber nicht mehr neu eingelöst werden."
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
