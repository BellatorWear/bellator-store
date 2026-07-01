"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { createProduct } from "./actions";
import PriceDisplay from "../shop/components/PriceDisplay";
import SizeButtons, { type SizeItem } from "./SizeButtons";
import ColorButtons, { type ColorItem } from "./ColorButtons";

type PendingImage = { url: string; uploading: boolean; error?: string };

export default function NewProductForm() {
  const [images, setImages] = useState<PendingImage[]>([]);
  const [sizes, setSizes] = useState<SizeItem[]>([]);
  const [colors, setColors] = useState<ColorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [previewName, setPreviewName] = useState("");
  const [previewDescription, setPreviewDescription] = useState("");
  const [previewPrice, setPreviewPrice] = useState("");
  const [previewCompareAt, setPreviewCompareAt] = useState("");
  const [previewDropLabel, setPreviewDropLabel] = useState("");
  const [isPreRelease, setIsPreRelease] = useState(false);

  async function uploadFile(file: File): Promise<PendingImage> {
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      return { url: blob.url, uploading: false };
    } catch (uploadErr) {
      const raw = uploadErr instanceof Error ? uploadErr.message : "Unbekannter Fehler";
      // "NetworkError when attempting to fetch resource" tritt auf, wenn
      // BLOB_READ_WRITE_TOKEN nicht gesetzt ist oder der Vercel Blob Store
      // nicht mit dem Projekt verbunden ist (Dashboard → Storage → Blob).
      const friendly = raw.includes("NetworkError")
        ? "Verbindungsfehler. Bitte prüfe: Vercel Dashboard → Storage → Blob-Store mit Projekt verbinden → Neu deployen."
        : raw;
      console.error("Bild-Upload fehlgeschlagen:", raw);
      return { url: "", uploading: false, error: friendly };
    }
  }

  async function handleMainImageClick() {
    mainImageInputRef.current?.click();
  }

  async function handleMainImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Platzhalter sofort zeigen
    setImages([{ url: "", uploading: true }]);
    const result = await uploadFile(file);
    setImages([result]);
    if (mainImageInputRef.current) mainImageInputRef.current.value = "";
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setErr("");
    setSuccess(false);

    if (images.some((img) => img.uploading)) {
      setErr("Bitte warten, bis alle Bilder hochgeladen sind.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData(formRef.current!);
      fd.delete("images");
      images.filter((img) => img.url).forEach((img) => fd.append("images", img.url));
      sizes.forEach((s) => fd.append("sizes", s.label));
      fd.append("colors", JSON.stringify(colors));
      const res = await createProduct(fd);
      if (res.error) { setErr(res.error); return; }
      setSuccess(true);
      formRef.current?.reset();
      setImages([]);
      setSizes([]);
      setColors([]);
      setPreviewName(""); setPreviewDescription(""); setPreviewPrice(""); setPreviewCompareAt(""); setPreviewDropLabel("");
      setIsPreRelease(false);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setErr("Unbekannter Fehler. Bitte nochmal versuchen.");
      console.error("Produkt anlegen fehlgeschlagen:", e);
    } finally {
      setLoading(false);
    }
  }

  const previewPriceCents = Math.round((parseFloat(previewPrice) || 0) * 100);
  const previewCompareAtCents = previewCompareAt ? Math.round((parseFloat(previewCompareAt) || 0) * 100) : null;
  const firstColorImage = colors[0]?.frontImage;
  const firstImage = firstColorImage || images.find((img) => img.url)?.url;
  const mainImg = images[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form ref={formRef} onSubmit={submit} className="space-y-3">
          <input name="name" placeholder="Name" required maxLength={80}
            value={previewName} onChange={(e) => setPreviewName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 hover:border-zinc-500 focus:border-white outline-none transition" />

          <textarea name="description" placeholder="Beschreibung" required maxLength={1000} rows={3}
            value={previewDescription} onChange={(e) => setPreviewDescription(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 hover:border-zinc-500 focus:border-white outline-none transition resize-none" />

          <SizeButtons
            sizes={sizes}
            loading={loading}
            onAdd={(label) => setSizes((prev) => [...prev, { label }])}
            onRemove={(item) => setSizes((prev) => prev.filter((s) => s.label !== item.label))}
          />
          <ColorButtons
            colors={colors}
            loading={loading}
            onAdd={(color) => setColors((prev) => [...prev, color])}
            onRemove={(item) => setColors((prev) => prev.filter((c) => c.name !== item.name))}
          />

          <div className="flex gap-3">
            <input name="price" type="number" step="0.01" min="0.01" placeholder="Preis (€)" required
              value={previewPrice} onChange={(e) => setPreviewPrice(e.target.value)}
              className="w-1/2 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 hover:border-zinc-500 focus:border-white outline-none transition" />
            <input name="compareAtPrice" type="number" step="0.01" min="0" placeholder="Alter Preis (€, optional)"
              value={previewCompareAt} onChange={(e) => setPreviewCompareAt(e.target.value)}
              className="w-1/2 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 hover:border-zinc-500 focus:border-white outline-none transition" />
          </div>

          <div className="flex gap-3">
            <input name="dropLimit" type="number" min="1" placeholder="Drop-Menge (opt.)"
              className="w-1/2 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 hover:border-zinc-500 focus:border-white outline-none transition" />
            <input name="dropLabel" placeholder="Drop-Bezeichnung (z.B. 'Drop #2')" maxLength={40}
              value={previewDropLabel} onChange={(e) => setPreviewDropLabel(e.target.value)}
              className="w-1/2 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 hover:border-zinc-500 focus:border-white outline-none transition" />
          </div>

          <div className="flex gap-3 items-end">
            <div className="w-1/2">
              <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Drop-Datum (optional)</label>
              <input name="dropDate" type="datetime-local"
                className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white hover:border-zinc-500 focus:border-white outline-none transition" />
            </div>
            <label className="w-1/2 flex items-center gap-2 text-xs text-zinc-400 pb-2 cursor-pointer">
              <input type="checkbox" checked={isPreRelease} onChange={(e) => setIsPreRelease(e.target.checked)} />
              Pre-Release
            </label>
          </div>
          <input type="hidden" name="isPreRelease" value={String(isPreRelease)} />

          {/* Hauptbild — großes, klickbares Feld */}
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Hauptbild</label>
            <button
              type="button"
              onClick={handleMainImageClick}
              className="w-full aspect-video border-2 border-dashed border-zinc-600 bg-zinc-900 flex flex-col items-center justify-center hover:border-white transition-all cursor-pointer overflow-hidden relative"
            >
              {mainImg?.uploading ? (
                <p className="text-xs text-zinc-400 uppercase tracking-widest">Lädt hoch...</p>
              ) : mainImg?.error ? (
                <p className="text-[9px] text-red-400 px-4 text-center leading-relaxed">{mainImg.error}</p>
              ) : mainImg?.url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mainImg.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] uppercase tracking-widest px-2 py-1">Klicken zum Ändern</span>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-zinc-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Klicken zum Hochladen</span>
                </>
              )}
            </button>
            <input ref={mainImageInputRef} type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />
          </div>

          {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}
          {success && <p className="text-[10px] text-green-500 uppercase tracking-widest">✓ Produkt angelegt!</p>}

          <button type="submit" disabled={loading}
            className="border border-zinc-500 px-6 py-2.5 text-[10px] uppercase tracking-widest font-bold text-white hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Wird angelegt..." : "Produkt anlegen"}
          </button>
        </form>

        {/* Live-Vorschau */}
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Live-Vorschau</p>
          <div className="border-[3px] border-zinc-700 bg-black p-5 space-y-3">
            <div className="bg-zinc-900 border border-zinc-800 aspect-square flex items-center justify-center overflow-hidden">
              {firstImage
                ? <img src={firstImage} alt="" className="max-h-full object-contain" />
                : <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Kein Bild</span>}
            </div>
            {previewDropLabel && <span className="inline-block text-[10px] uppercase tracking-widest font-bold border border-zinc-600 text-zinc-400 px-2 py-1">{previewDropLabel}</span>}
            <h1 className="text-2xl font-black uppercase text-white leading-tight">{previewName || "Produktname"}</h1>
            <PriceDisplay priceCents={previewPriceCents || 0} compareAtPriceCents={previewCompareAtCents} />
            {colors.length > 0 && <div className="flex gap-1.5">{colors.map((c) => <span key={c.name} className="w-6 h-6 border border-zinc-700" style={{ backgroundColor: c.hexColor }} title={c.name} />)}</div>}
            {sizes.length > 0 && <div className="flex gap-1.5">{sizes.map((s) => <span key={s.label} className="w-7 h-7 border border-zinc-700 flex items-center justify-center text-[9px] text-zinc-400">{s.label}</span>)}</div>}
            <p className="text-xs text-zinc-400 leading-relaxed">{previewDescription || "Beschreibung erscheint hier..."}</p>
            <div className="w-full py-3 text-center uppercase font-black tracking-[0.2em] border-[3px] border-zinc-700 text-white text-xs">Zum Warenkorb hinzufügen</div>
          </div>
        </div>
      </div>
    </div>
  );
}
