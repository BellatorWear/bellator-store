"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProduct, deleteProduct, addVariant, deleteVariant, addColor, deleteColor, updateVariantStock } from "./actions";
import ConfirmDialog from "./ConfirmDialog";
import PriceDisplay from "../shop/components/PriceDisplay";
import SizeButtons, { type SizeItem } from "./SizeButtons";
import ColorButtons, { type ColorItem } from "./ColorButtons";

type Product = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  active: boolean | null;
  dropLabel: string | null;
  dropLimit: number | null;
  soldCount: number | null;
  slug: string;
  isPreRelease: boolean | null;
  dropDate: Date | string | null;
};
type Variant = { id: number; label: string; stock: number | null };
type Color = { id: number; name: string; hexColor: string; frontImage: string; backImage: string };

export default function ProductRow({ product, variants, colors }: { product: Product; variants: Variant[]; colors: Color[] }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState((product.priceCents / 100).toString());
  const [compareAtPrice, setCompareAtPrice] = useState(product.compareAtPriceCents ? (product.compareAtPriceCents / 100).toString() : "");
  const [dropLabel, setDropLabel] = useState(product.dropLabel ?? "");
  const [dropLimit, setDropLimit] = useState(product.dropLimit ? String(product.dropLimit) : "");
  const [isPreRelease, setIsPreRelease] = useState(product.isPreRelease ?? false);
  const [dropDate, setDropDate] = useState(
    product.dropDate ? new Date(product.dropDate).toISOString().slice(0, 16) : "",
  );
  const [active, setActive] = useState(product.active ?? true);
  const [loading, setLoading] = useState(false);
  const [variantBusy, setVariantBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function save() {
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("id", String(product.id));
      fd.append("name", name);
      fd.append("description", description);
      fd.append("price", price);
      fd.append("compareAtPrice", compareAtPrice);
      fd.append("dropLabel", dropLabel);
      fd.append("dropLimit", dropLimit);
      fd.append("isPreRelease", String(isPreRelease));
      fd.append("dropDate", dropDate);
      fd.append("active", String(active));
      const res = await updateProduct(fd);
      if (res?.error) {
        setErr(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch (e) {
      console.error("Produkt speichern fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const fd = new FormData();
      fd.append("id", String(product.id));
      await deleteProduct(fd);
      router.refresh();
    } catch (e) {
      console.error("Produkt löschen fehlgeschlagen:", e);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleAddSize(label: string) {
    setVariantBusy(true);
    try {
      const fd = new FormData();
      fd.append("productId", String(product.id));
      fd.append("label", label);
      await addVariant(fd);
      router.refresh();
    } catch (e) {
      console.error("Größe hinzufügen fehlgeschlagen:", e);
    } finally {
      setVariantBusy(false);
    }
  }

  async function handleRemoveSize(item: SizeItem) {
    if (!item.id) return;
    setVariantBusy(true);
    try {
      const fd = new FormData();
      fd.append("id", String(item.id));
      await deleteVariant(fd);
      router.refresh();
    } catch (e) {
      console.error("Größe löschen fehlgeschlagen:", e);
    } finally {
      setVariantBusy(false);
    }
  }

  async function handleAddColor(color: ColorItem) {
    setVariantBusy(true);
    try {
      const fd = new FormData();
      fd.append("productId", String(product.id));
      fd.append("name", color.name);
      fd.append("hexColor", color.hexColor);
      fd.append("frontImage", color.frontImage);
      fd.append("backImage", color.backImage);
      const res = await addColor(fd);
      if (res?.error) setErr(res.error);
      router.refresh();
    } catch (e) {
      console.error("Farbe hinzufügen fehlgeschlagen:", e);
    } finally {
      setVariantBusy(false);
    }
  }

  async function handleRemoveColor(item: ColorItem) {
    if (!item.id) return;
    setVariantBusy(true);
    try {
      const fd = new FormData();
      fd.append("id", String(item.id));
      await deleteColor(fd);
      router.refresh();
    } catch (e) {
      console.error("Farbe löschen fehlgeschlagen:", e);
    } finally {
      setVariantBusy(false);
    }
  }

  return (
    <div className="border border-zinc-700 p-4 space-y-3">
      {editing ? (
        <div className="space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Beschreibung"
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Preis (€)</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01"
                className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm" />
            </div>
            <div>
              <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Alter Preis (€, optional = Rabatt)</label>
              <input value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} type="number" step="0.01" placeholder="z.B. 45.00"
                className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Drop-Label</label>
              <input value={dropLabel} onChange={(e) => setDropLabel(e.target.value)} placeholder="z.B. Drop #2"
                className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm" />
            </div>
            <div>
              <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Drop-Limit (leer = unlimitiert)</label>
              <input value={dropLimit} onChange={(e) => setDropLimit(e.target.value)} type="number"
                className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 items-end">
            <div>
              <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Drop-Datum (optional)</label>
              <input value={dropDate} onChange={(e) => setDropDate(e.target.value)} type="datetime-local"
                className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-xs text-zinc-400 pb-2 cursor-pointer">
              <input type="checkbox" checked={isPreRelease} onChange={(e) => setIsPreRelease(e.target.checked)} />
              Pre-Release
            </label>
          </div>
          {compareAtPrice && (
            <div className="pt-1">
              <PriceDisplay priceCents={Math.round((parseFloat(price) || 0) * 100)} compareAtPriceCents={Math.round((parseFloat(compareAtPrice) || 0) * 100)} size="sm" />
            </div>
          )}
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Aktiv (sichtbar im Shop)
          </label>
          {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={loading}
              className="border border-zinc-500 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition disabled:opacity-50">
              {loading ? "..." : "Speichern"}
            </button>
            <button onClick={() => setEditing(false)} disabled={loading}
              className="border border-zinc-700 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400">
              Abbrechen
            </button>
            <a href={`/shop/produkt/${product.slug}`} target="_blank" rel="noopener noreferrer"
              className="border border-zinc-700 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white transition">
              Live-Vorschau ↗
            </a>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div className="min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-widest">
              {product.name} {!product.active && <span className="text-red-500">(inaktiv)</span>}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">{product.description}</p>
            <div className="mt-2">
              <PriceDisplay priceCents={product.priceCents} compareAtPriceCents={product.compareAtPriceCents} size="sm" />
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Verkauft: {product.soldCount ?? 0}
              {product.dropLimit ? ` / ${product.dropLimit}` : " (unlimitiert)"}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href={`/shop/produkt/${product.slug}`}
              className="border border-zinc-700 px-3 py-1.5 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition">
              Details ansehen
            </a>
            <button onClick={() => setEditing(true)}
              className="border border-zinc-700 px-3 py-1.5 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition">
              Bearbeiten
            </button>
            <button onClick={() => setConfirmDelete(true)}
              className="border border-red-800 text-red-500 px-3 py-1.5 text-[10px] uppercase tracking-widest hover:bg-red-900/30 transition">
              Löschen
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-zinc-800 pt-3 space-y-4">
        <SizeButtons
          sizes={variants}
          loading={variantBusy}
          onAdd={handleAddSize}
          onRemove={handleRemoveSize}
        />
        {variants.length > 0 && <VariantStockEditor variants={variants} />}
        <ColorButtons
          colors={colors}
          loading={variantBusy}
          onAdd={handleAddColor}
          onRemove={handleRemoveColor}
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Produkt löschen?"
        message={`"${product.name}" wird unwiderruflich gelöscht, inkl. aller Größen, Farben und Bilder.`}
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

// Bisher gab's im gesamten Adminpanel keine Möglichkeit, den Stock einer
// bestehenden Größe zu erhöhen (nur beim Anlegen setzen, danach sinkt er
// nur noch durch Verkäufe). Kompakter Inline-Editor statt eigenem Modal,
// da es nur ein Zahlenfeld pro Größe ist.
function VariantStockEditor({ variants }: { variants: { id: number; label: string; stock: number | null }[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<number, string>>(() =>
    Object.fromEntries(variants.map((v) => [v.id, v.stock === null ? "" : String(v.stock)])),
  );
  const [savingId, setSavingId] = useState<number | null>(null);

  async function save(variantId: number) {
    setSavingId(variantId);
    try {
      const fd = new FormData();
      fd.append("variantId", String(variantId));
      fd.append("stock", values[variantId] ?? "");
      const res = await updateVariantStock(fd);
      if (res?.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Lagerbestand (leer = unlimitiert)</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => (
          <div key={v.id} className="flex items-center gap-1.5 border border-zinc-800 px-2 py-1.5">
            <span className="text-[10px] text-zinc-500 uppercase">{v.label}</span>
            <input
              type="number"
              min={0}
              value={values[v.id] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [v.id]: e.target.value }))}
              className="w-16 bg-zinc-950 border border-zinc-700 px-1.5 py-0.5 text-xs text-white"
            />
            <button
              type="button"
              onClick={() => save(v.id)}
              disabled={savingId === v.id}
              className="text-[9px] uppercase tracking-widest text-zinc-400 hover:text-white transition disabled:opacity-50"
            >
              {savingId === v.id ? "..." : "Speichern"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

