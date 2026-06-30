"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { createProduct } from "./actions";
import PriceDisplay from "../shop/components/PriceDisplay";
import SizeButtons, { type SizeItem } from "./SizeButtons";
import ColorButtons, { type ColorItem } from "./ColorButtons";

const MAX_IMAGES = 4;

type PendingImage = { url: string; uploading: boolean; error?: string };

export default function NewProductForm() {
  const [images, setImages] = useState<PendingImage[]>([]);
  const [sizes, setSizes] = useState<SizeItem[]>([]);
  const [colors, setColors] = useState<ColorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Live-Vorschau-Felder, gespiegelt vom Formular, damit man direkt sieht
  // wie es später auf der "Details ansehen"-Seite aussehen wird.
  const [previewName, setPreviewName] = useState("");
  const [previewDescription, setPreviewDescription] = useState("");
  const [previewPrice, setPreviewPrice] = useState("");
  const [previewCompareAt, setPreviewCompareAt] = useState("");
  const [previewDropLabel, setPreviewDropLabel] = useState("");
  const [isPreRelease, setIsPreRelease] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    const room = MAX_IMAGES - images.length;
    const toUpload = files.slice(0, Math.max(0, room));

    // Sofort Platzhalter anzeigen, damit man sieht dass der Upload läuft -
    // die Datei geht direkt vom Browser zu Vercel Blob, NICHT über unseren
    // Server (sonst würde Vercels 4,5-MB-Limit pro Function greifen).
    const placeholders = toUpload.map(() => ({ url: "", uploading: true }) as PendingImage);
    setImages((prev) => [...prev, ...placeholders]);

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      const indexInState = images.length + i;
      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
        });
        setImages((prev) =>
          prev.map((img, idx) => (idx === indexInState ? { url: blob.url, uploading: false } : img)),
        );
      } catch (uploadErr) {
        // Den ECHTEN Fehlergrund anzeigen statt nur "Fehler" - meistens
        // bedeutet das: in Vercel ist noch kein Blob-Store mit dem Projekt
        // verbunden (Dashboard -> Storage -> Create Database -> Blob), wodurch
        // BLOB_READ_WRITE_TOKEN fehlt.
        const message = uploadErr instanceof Error ? uploadErr.message : "Unbekannter Fehler";
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === indexInState
              ? { url: "", uploading: false, error: message }
              : img,
          ),
        );
        console.error("Bild-Upload fehlgeschlagen:", uploadErr);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
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
      if (res.error) {
        setErr(res.error);
        return;
      }
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
              <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                Drop-Datum (optional)
              </label>
              <input name="dropDate" type="datetime-local"
                className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white hover:border-zinc-500 focus:border-white outline-none transition" />
            </div>
            <label className="w-1/2 flex items-center gap-2 text-xs text-zinc-400 pb-2 cursor-pointer">
              <input type="checkbox" checked={isPreRelease} onChange={(e) => setIsPreRelease(e.target.checked)} />
              Pre-Release (vor Drop-Datum nur mit Zugangscode sichtbar)
            </label>
          </div>
          <input type="hidden" name="isPreRelease" value={String(isPreRelease)} />
          <p className="text-[9px] text-zinc-600 -mt-1">
            Ohne Haken wird das Produkt zum Drop-Datum automatisch für alle freigegeben (falls gesetzt) -
            mit Haken ist es vorher nur für User mit gültigem Pre-Release-Code sichtbar.
          </p>

          {/* Bilder Upload - geht direkt zu Vercel Blob, nicht über den Server */}
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
              Bilder (max. {MAX_IMAGES}, hochauflösend möglich)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="border border-zinc-600 px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-400 hover:border-white hover:text-white transition font-bold">
                Bilder auswählen
              </span>
              <span className="text-[10px] text-zinc-600">
                {images.length === 0 ? "Keine Dateien ausgewählt" : `${images.length} Bild${images.length > 1 ? "er" : ""} ausgewählt`}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
            </label>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {images.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 border border-zinc-700 flex items-center justify-center bg-zinc-900">
                    {img.uploading ? (
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest text-center px-1">Lädt...</span>
                    ) : img.error ? (
                      <span className="text-[7px] text-red-500 uppercase tracking-widest text-center px-1 leading-tight" title={img.error}>
                        {img.error.length > 40 ? img.error.slice(0, 40) + "…" : img.error}
                      </span>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white text-[10px] font-black flex items-center justify-center hover:bg-red-500 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.some((img) => img.error) && (
              <p className="text-[9px] text-zinc-500 mt-2 leading-relaxed">
                Upload-Fehler? Meistens fehlt der Vercel-Blob-Store: im Vercel Dashboard unter „Storage" einen
                Blob-Store anlegen und mit diesem Projekt verbinden (fügt BLOB_READ_WRITE_TOKEN automatisch hinzu),
                dann neu deployen.
              </p>
            )}
          </div>

          {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}
          {success && <p className="text-[10px] text-green-500 uppercase tracking-widest">✓ Produkt angelegt!</p>}

          <button
            type="submit"
            disabled={loading}
            className="border border-zinc-500 px-6 py-2.5 text-[10px] uppercase tracking-widest font-bold text-white hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Wird angelegt..." : "Produkt anlegen"}
          </button>
        </form>

        {/* Live-Vorschau: so wird es ungefähr auf der "Details ansehen"-Seite aussehen */}
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Live-Vorschau</p>
          <div className="border-[3px] border-zinc-700 bg-black p-5 space-y-3">
            <div className="bg-zinc-900 border border-zinc-800 aspect-square flex items-center justify-center overflow-hidden">
              {firstImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firstImage} alt="" className="max-h-full object-contain" />
              ) : (
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Kein Bild</span>
              )}
            </div>
            {previewDropLabel && (
              <span className="inline-block text-[10px] uppercase tracking-widest font-bold border border-zinc-600 text-zinc-400 px-2 py-1">
                {previewDropLabel}
              </span>
            )}
            <h1 className="text-2xl font-black uppercase text-white leading-tight">
              {previewName || "Produktname"}
            </h1>
            <PriceDisplay priceCents={previewPriceCents || 0} compareAtPriceCents={previewCompareAtCents} />
            {colors.length > 0 && (
              <div className="flex gap-1.5">
                {colors.map((c) => (
                  <span key={c.name} className="w-6 h-6 border border-zinc-700" style={{ backgroundColor: c.hexColor }} title={c.name} />
                ))}
              </div>
            )}
            {sizes.length > 0 && (
              <div className="flex gap-1.5">
                {sizes.map((s) => (
                  <span key={s.label} className="w-7 h-7 border border-zinc-700 flex items-center justify-center text-[9px] text-zinc-400">{s.label}</span>
                ))}
              </div>
            )}
            <p className="text-xs text-zinc-400 leading-relaxed">
              {previewDescription || "Beschreibung erscheint hier..."}
            </p>
            <div className="w-full py-3 text-center uppercase font-black tracking-[0.2em] border-[3px] border-zinc-700 text-white text-xs">
              Zum Warenkorb hinzufügen
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
