"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProduct, deleteProduct, addVariant, deleteVariant } from "./actions";

type Product = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  active: boolean | null;
  dropLimit: number | null;
  soldCount: number | null;
  slug: string;
};
type Variant = { id: number; label: string; stock: number | null };

export default function ProductRow({ product, variants }: { product: Product; variants: Variant[] }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState((product.priceCents / 100).toString());
  const [active, setActive] = useState(product.active ?? true);
  const [variantLabel, setVariantLabel] = useState("");
  const [variantStock, setVariantStock] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function save() {
    setLoading(true);
    const fd = new FormData();
    fd.append("id", String(product.id));
    fd.append("name", name);
    fd.append("description", description);
    fd.append("price", price);
    fd.append("active", String(active));
    await updateProduct(fd);
    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`"${product.name}" wirklich löschen?`)) return;
    const fd = new FormData();
    fd.append("id", String(product.id));
    await deleteProduct(fd);
    router.refresh();
  }

  async function addVariantSubmit() {
    if (!variantLabel.trim()) return;
    const fd = new FormData();
    fd.append("productId", String(product.id));
    fd.append("label", variantLabel);
    fd.append("stock", variantStock);
    await addVariant(fd);
    setVariantLabel("");
    setVariantStock("");
    router.refresh();
  }

  async function removeVariant(id: number) {
    const fd = new FormData();
    fd.append("id", String(id));
    await deleteVariant(fd);
    router.refresh();
  }

  return (
    <div className="border border-zinc-700 p-4 space-y-3">
      {editing ? (
        <div className="space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm" />
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01"
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm" />
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Aktiv (sichtbar im Shop)
          </label>
          <div className="flex gap-2">
            <button onClick={save} disabled={loading}
              className="border border-zinc-500 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition">
              Speichern
            </button>
            <button onClick={() => setEditing(false)}
              className="border border-zinc-700 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400">
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div className="min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-widest">
              {product.name} {!product.active && <span className="text-red-500">(inaktiv)</span>}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">{product.description}</p>
            <p className="text-xs text-zinc-400 mt-1">
              {(product.priceCents / 100).toFixed(2)} € · Verkauft: {product.soldCount ?? 0}
              {product.dropLimit ? ` / ${product.dropLimit}` : " (unlimitiert)"}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing(true)}
              className="border border-zinc-700 px-3 py-1.5 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition">
              Bearbeiten
            </button>
            <button onClick={remove}
              className="border border-red-800 text-red-500 px-3 py-1.5 text-[10px] uppercase tracking-widest hover:bg-red-900/30 transition">
              Löschen
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-zinc-800 pt-3">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Varianten</p>
        <div className="space-y-1 mb-2">
          {variants.map((v) => (
            <div key={v.id} className="flex justify-between text-xs text-zinc-400">
              <span>{v.label} {v.stock !== null ? `(${v.stock} auf Lager)` : "(unlimitiert)"}</span>
              <button onClick={() => removeVariant(v.id)} className="text-red-500 hover:text-red-400">✕</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={variantLabel} onChange={(e) => setVariantLabel(e.target.value)} placeholder="z.B. M / Schwarz"
            className="flex-1 bg-zinc-900 border border-zinc-700 p-1.5 text-xs" />
          <input value={variantStock} onChange={(e) => setVariantStock(e.target.value)} placeholder="Lager" type="number"
            className="w-20 bg-zinc-900 border border-zinc-700 p-1.5 text-xs" />
          <button onClick={addVariantSubmit}
            className="border border-zinc-700 px-2 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition">
            +
          </button>
        </div>
      </div>
    </div>
  );
}
