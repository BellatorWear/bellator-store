"use client";

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
  function toggle(label: string) {
    if (loading) return;
    const existing = sizes.find((s) => s.label === label);
    if (existing) {
      onRemove(existing);
    } else {
      onAdd(label);
    }
  }

  return (
    <div>
      <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
        Größen <span className="text-zinc-600 normal-case">(anklicken zum Hinzufügen/Entfernen)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {STANDARD_SIZES.map((label) => {
          const active = sizes.some((s) => s.label === label);
          return (
            <button
              key={label}
              type="button"
              onClick={() => toggle(label)}
              disabled={loading}
              title={active ? "Klicken zum Entfernen" : "Klicken zum Hinzufügen"}
              className={`w-12 h-12 border text-xs font-bold transition-all flex items-center justify-center disabled:opacity-50 ${
                active
                  ? "border-white bg-white text-black"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-400 hover:text-white"
              }`}
            >
              {label === "One Size" ? "OS" : label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
