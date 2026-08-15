"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProduct } from "@/app/admin/actions";

type Product = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  dropLabel: string | null;
  dropLimit: number | null;
  active?: boolean | null;
};

/**
 * War früher direkt in ProductDetailClient.tsx eingebettet - dadurch
 * landete das komplette Admin-Bearbeiten-Formular (inkl. der
 * updateProduct-Server-Action-Referenz) im JS-Bundle JEDER Produktseite,
 * für JEDEN Besucher, obwohl das nur die Handvoll Admins je nutzt. Als
 * eigene Komponente + next/dynamic in ProductDetailClient.tsx wird dieser
 * Code jetzt nur dann überhaupt heruntergeladen, wenn ein Admin tatsächlich
 * auf "Als Admin bearbeiten" klickt.
 */
export default function ProductEditForm({
  product,
  onCancel,
}: {
  product: Product;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState((product.priceCents / 100).toString());
  const [compareAtPrice, setCompareAtPrice] = useState(product.compareAtPriceCents ? (product.compareAtPriceCents / 100).toString() : "");
  const [dropLabel, setDropLabel] = useState(product.dropLabel ?? "");
  const [dropLimit, setDropLimit] = useState(product.dropLimit ? String(product.dropLimit) : "");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  async function saveEdit() {
    if (saving) return;
    setSaving(true);
    setSaveErr("");
    try {
      const fd = new FormData();
      fd.append("id", String(product.id));
      fd.append("name", name);
      fd.append("description", description);
      fd.append("price", price);
      fd.append("compareAtPrice", compareAtPrice);
      fd.append("dropLabel", dropLabel);
      fd.append("dropLimit", dropLimit);
      fd.append("active", String(product.active ?? true));
      const res = await updateProduct(fd);
      if (res?.error) {
        setSaveErr(res.error);
        return;
      }
      router.refresh();
      onCancel();
    } catch (e) {
      console.error("Speichern fehlgeschlagen:", e);
      setSaveErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
        className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Beschreibung"
        className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white resize-none" />
      <div className="grid grid-cols-2 gap-2">
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" placeholder="Preis (€)"
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
        <input value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} type="number" step="0.01" placeholder="Alter Preis (€, opt.)"
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input value={dropLabel} onChange={(e) => setDropLabel(e.target.value)} placeholder="Drop-Label"
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
        <input value={dropLimit} onChange={(e) => setDropLimit(e.target.value)} type="number" placeholder="Drop-Limit"
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
      </div>
      <p className="text-[9px] text-zinc-500">Größen & Farben lassen sich im Admin-Panel verwalten.</p>
      {saveErr && <p className="text-[10px] text-red-500 uppercase tracking-widest">{saveErr}</p>}
      <div className="flex gap-2">
        <button onClick={saveEdit} disabled={saving}
          className="flex-1 t-btn-primary py-2.5 font-black text-xs uppercase tracking-widest transition disabled:opacity-50">
          {saving ? "..." : "Speichern"}
        </button>
        <button onClick={onCancel} disabled={saving}
          className="flex-1 t-btn-outline py-2.5 font-black text-xs uppercase tracking-widest transition">
          Abbrechen
        </button>
      </div>
    </div>
  );
}
