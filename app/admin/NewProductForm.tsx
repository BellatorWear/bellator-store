"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "./actions";

const MAX_IMAGES = 4;

export default function NewProductForm() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
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
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const fd = new FormData(formRef.current!);
    images.forEach((img) => fd.append("images", img));
    const res = await createProduct(fd);
    setLoading(false);
    if (res.error) {
      setErr(res.error);
      return;
    }
    formRef.current?.reset();
    setImages([]);
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={submit} className="border border-zinc-700 p-4 sm:p-6 space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Neues Produkt</h2>
      <input name="name" placeholder="Name" required maxLength={80}
        className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm" />
      <textarea name="description" placeholder="Beschreibung" required maxLength={1000} rows={3}
        className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm" />
      <div className="flex gap-3">
        <input name="price" type="number" step="0.01" min="0.01" placeholder="Preis (€)" required
          className="w-1/2 bg-zinc-900 border border-zinc-700 p-2 text-sm" />
        <input name="dropLimit" type="number" min="1" placeholder="Drop-Menge (leer = unlimitiert)"
          className="w-1/2 bg-zinc-900 border border-zinc-700 p-2 text-sm" />
      </div>
      <input name="dropLabel" placeholder="Drop-Bezeichnung (z.B. 'Drop #2', optional)" maxLength={40}
        className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm" />
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
          Bilder (max. {MAX_IMAGES})
        </label>
        <input type="file" accept="image/*" multiple onChange={handleFiles}
          className="text-xs text-zinc-400" />
        {images.length > 0 && (
          <div className="flex gap-2 mt-2">
            {images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={img} alt="" className="w-14 h-14 object-cover border border-zinc-700" />
            ))}
          </div>
        )}
      </div>
      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}
      <button type="submit" disabled={loading}
        className="border border-zinc-500 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition disabled:opacity-50">
        {loading ? "..." : "Produkt anlegen"}
      </button>
    </form>
  );
}
