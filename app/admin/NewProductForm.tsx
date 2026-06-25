"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "./actions";

const MAX_IMAGES = 4;

export default function NewProductForm() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const next: string[] = [...images];
    for (const file of files) {
      if (next.length >= MAX_IMAGES) break;
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      next.push(dataUrl);
    }
    setImages(next);
    // Input zurücksetzen damit man dieselbe Datei nochmal wählen kann
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(i: number) {
    setImages(prev => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setErr("");
    setSuccess(false);
    setLoading(true);
    try {
      const fd = new FormData(formRef.current!);
      // Bilder separat anhängen da sie nicht im normalen FormData sind
      fd.delete("images"); // falls was drin ist
      images.forEach((img) => fd.append("images", img));
      const res = await createProduct(fd);
      if (res.error) {
        setErr(res.error);
        return;
      }
      setSuccess(true);
      formRef.current?.reset();
      setImages([]);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setErr("Unbekannter Fehler. Bitte nochmal versuchen.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} className="border border-zinc-700 p-4 sm:p-6 space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Neues Produkt</h2>

      <input name="name" placeholder="Name" required maxLength={80}
        className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 hover:border-zinc-500 focus:border-white outline-none transition" />

      <textarea name="description" placeholder="Beschreibung" required maxLength={1000} rows={3}
        className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 hover:border-zinc-500 focus:border-white outline-none transition resize-none" />

      <div className="flex gap-3">
        <input name="price" type="number" step="0.01" min="0.01" placeholder="Preis (€)" required
          className="w-1/2 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 hover:border-zinc-500 focus:border-white outline-none transition" />
        <input name="dropLimit" type="number" min="1" placeholder="Drop-Menge (opt.)"
          className="w-1/2 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 hover:border-zinc-500 focus:border-white outline-none transition" />
      </div>

      <input name="dropLabel" placeholder="Drop-Bezeichnung (z.B. 'Drop #2', optional)" maxLength={40}
        className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600 hover:border-zinc-500 focus:border-white outline-none transition" />

      {/* Bilder Upload */}
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
          Bilder (max. {MAX_IMAGES})
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
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-16 h-16 object-cover border border-zinc-700" />
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
  );
}
