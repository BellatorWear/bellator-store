"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { updateColorImages } from "./actions";

export type ColorItem = { id?: number; name: string; hexColor: string; frontImage: string; backImage: string };

async function uploadOne(file: File): Promise<string> {
  const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/admin/upload" });
  return blob.url;
}

function ImageSlot({
  label,
  url,
  onUploaded,
}: {
  label: string;
  url: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr("");
    try {
      const uploadedUrl = await uploadOne(file);
      onUploaded(uploadedUrl);
    } catch (uploadErr) {
      const message = uploadErr instanceof Error ? uploadErr.message : "Unbekannter Fehler";
      setErr(message);
      console.error(`${label}-Bild Upload fehlgeschlagen:`, uploadErr);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <label className="flex flex-col items-center gap-1 cursor-pointer">
      <div className="w-16 h-16 border border-zinc-700 bg-zinc-900 flex items-center justify-center overflow-hidden">
        {uploading ? (
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest">Lädt...</span>
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[8px] text-zinc-600 uppercase tracking-widest text-center px-1">{label}</span>
        )}
      </div>
      <span className="text-[8px] text-zinc-500 uppercase tracking-widest">{label}</span>
      {err && <span className="text-[7px] text-red-500 text-center max-w-[80px] leading-tight">{err}</span>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </label>
  );
}

function ExistingColorEditor({ color, onClose, onSaved }: { color: ColorItem; onClose: () => void; onSaved: () => void }) {
  const [frontImage, setFrontImage] = useState("");
  const [backImage, setBackImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!frontImage && !backImage) { setErr("Neues Bild auswählen."); return; }
    setSaving(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("id", String(color.id));
      fd.append("frontImage", frontImage);
      fd.append("backImage", backImage);
      const res = await updateColorImages(fd);
      if (res?.error) { setErr(res.error); return; }
      onSaved();
    } catch (e) {
      console.error("Farbbild speichern fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-zinc-700 p-3 space-y-3 max-w-sm">
      <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
        Bilder für &quot;{color.name}&quot; ersetzen (leer lassen = unverändert)
      </p>
      <div className="flex gap-3">
        <div>
          <p className="text-[8px] text-zinc-600 uppercase tracking-widest mb-1 text-center">Aktuell</p>
          <ImageSlot label="Vorderseite" url={frontImage || color.frontImage} onUploaded={setFrontImage} />
        </div>
        <div>
          <p className="text-[8px] text-zinc-600 uppercase tracking-widest mb-1 text-center">Aktuell</p>
          <ImageSlot label="Rückseite" url={backImage || color.backImage} onUploaded={setBackImage} />
        </div>
      </div>
      {err && <p className="text-[9px] text-red-500 uppercase tracking-widest">{err}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={saving}
          className="border border-zinc-500 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition disabled:opacity-50">
          {saving ? "..." : "Speichern"}
        </button>
        <button type="button" onClick={onClose} disabled={saving}
          className="border border-zinc-700 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

export default function ColorButtons({
  colors,
  onAdd,
  onRemove,
  loading,
}: {
  colors: ColorItem[];
  onAdd: (color: ColorItem) => void | Promise<void>;
  onRemove: (item: ColorItem) => void | Promise<void>;
  loading?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [hexColor, setHexColor] = useState("#000000");
  const [frontImage, setFrontImage] = useState("");
  const [backImage, setBackImage] = useState("");
  const [err, setErr] = useState("");
  const [editingColorId, setEditingColorId] = useState<number | null>(null);
  const router = useRouter();

  async function confirmAdd() {
    setErr("");
    if (!name.trim()) { setErr("Name erforderlich."); return; }
    if (!frontImage || !backImage) { setErr("Vorder- UND Rückseiten-Bild hochladen."); return; }
    await onAdd({ name: name.trim(), hexColor, frontImage, backImage });
    setName(""); setHexColor("#000000"); setFrontImage(""); setBackImage("");
    setAdding(false);
  }

  return (
    <div>
      <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
        Farben <span className="text-zinc-600 normal-case">(Klick = Bilder bearbeiten)</span>
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {colors.map((c) => (
          <div key={c.id ?? c.name} className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setEditingColorId(editingColorId === c.id ? null : (c.id ?? null))}
              disabled={loading}
              title={`${c.name} - Klicken zum Bearbeiten`}
              className={`w-12 h-12 border transition-all disabled:opacity-50 ${editingColorId === c.id ? "border-white border-2" : "border-zinc-600 hover:border-white"}`}
              style={{ backgroundColor: c.hexColor }}
            />
            <button
              type="button"
              onClick={() => onRemove(c)}
              disabled={loading}
              title={`${c.name} entfernen`}
              className="text-[8px] text-zinc-600 hover:text-red-500 transition uppercase tracking-widest"
            >
              Entfernen
            </button>
          </div>
        ))}
        {colors.length === 0 && !adding && (
          <p className="text-[10px] text-zinc-600 self-center">Noch keine Farben.</p>
        )}
      </div>

      {editingColorId !== null && (
        <div className="mb-3">
          <ExistingColorEditor
            color={colors.find((c) => c.id === editingColorId)!}
            onClose={() => setEditingColorId(null)}
            onSaved={() => { setEditingColorId(null); router.refresh(); }}
          />
        </div>
      )}

      {adding ? (
        <div className="border border-zinc-700 p-3 space-y-3 max-w-sm">
          <div className="flex gap-2 items-center">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Farbname (z.B. Schwarz)"
              maxLength={30}
              className="flex-1 bg-zinc-900 border border-zinc-700 p-2 text-xs text-white placeholder:text-zinc-600"
            />
            <input
              type="color"
              value={hexColor}
              onChange={(e) => setHexColor(e.target.value)}
              className="w-9 h-9 border border-zinc-700 bg-zinc-900 cursor-pointer"
              title="Farbwert für den Button"
            />
          </div>
          <div className="flex gap-3">
            <ImageSlot label="Vorderseite" url={frontImage} onUploaded={setFrontImage} />
            <ImageSlot label="Rückseite" url={backImage} onUploaded={setBackImage} />
          </div>
          {err && <p className="text-[9px] text-red-500 uppercase tracking-widest">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={confirmAdd} disabled={loading}
              className="border border-zinc-500 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition disabled:opacity-50">
              Hinzufügen
            </button>
            <button type="button" onClick={() => setAdding(false)} disabled={loading}
              className="border border-zinc-700 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400">
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} disabled={loading}
          className="border border-zinc-700 px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-400 hover:border-white hover:text-white transition disabled:opacity-50">
          + Farbe hinzufügen
        </button>
      )}
    </div>
  );
}
