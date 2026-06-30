"use client";
import { useState } from "react";

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

export type SizeItem = { id?: number; label: string; stock?: number | null };

export default function SizeButtons({
  sizes,
  onAdd,
  onRemove,
  loading,
}: {
  sizes: SizeItem[];
  onAdd: (label: string) => void | Promise<void>;
  onRemove: (item: SizeItem) => void | Promise<void>;
  loading?: boolean;
}) {
  const [picked, setPicked] = useState("");

  const available = STANDARD_SIZES.filter((s) => !sizes.some((sz) => sz.label === s));

  async function handleAdd(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (!value) return;
    setPicked("");
    await onAdd(value);
  }

  return (
    <div>
      <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Größen</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {sizes.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onRemove(s)}
            disabled={loading}
            title="Klicken zum Entfernen"
            className="w-12 h-12 border border-zinc-600 bg-zinc-900 text-xs font-bold text-white hover:border-red-600 hover:text-red-500 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
        {sizes.length === 0 && (
          <p className="text-[10px] text-zinc-600 self-center">Noch keine Größen.</p>
        )}
      </div>
      {available.length > 0 ? (
        <select
          value={picked}
          onChange={handleAdd}
          disabled={loading}
          className="bg-zinc-900 border border-zinc-700 p-2 text-xs text-white hover:border-zinc-500 focus:border-white outline-none transition disabled:opacity-50"
        >
          <option value="">+ Größe hinzufügen...</option>
          {available.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ) : (
        <p className="text-[9px] text-zinc-600">Alle Standardgrößen vergeben.</p>
      )}
    </div>
  );
}
