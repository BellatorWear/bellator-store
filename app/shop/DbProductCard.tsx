"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addToCart } from "@/app/cart";

type Variant = { id: number; label: string; stock: number | null };
type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  images: string[] | null;
  dropLabel: string | null;
  dropLimit: number | null;
  soldCount: number | null;
};

export default function DbProductCard({ product, variants }: { product: Product; variants: Variant[] }) {
  const [variantId, setVariantId] = useState<number | null>(variants[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const remaining = product.dropLimit ? product.dropLimit - (product.soldCount ?? 0) : null;
  const soldOut = remaining !== null && remaining <= 0;

  async function handleAdd() {
    setLoading(true);
    const fd = new FormData();
    fd.append("productId", String(product.id));
    if (variantId) fd.append("variantId", String(variantId));
    fd.append("quantity", "1");
    await addToCart(fd);
    setLoading(false);
    setAdded(true);
    router.refresh();
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="relative w-full max-w-[380px] t-card border-[3px] t-border p-5 sm:p-6"
      style={{ boxShadow: "8px 8px 0px 0px var(--shadow)" }}>
      <div className="flex justify-between items-center mb-4 text-[10px] uppercase tracking-widest">
        <span className="border border-zinc-600 px-2 py-1 t-muted font-bold">{product.dropLabel || "Drop"}</span>
        {soldOut ? (
          <span className="border border-red-700 px-2 py-1 text-red-400 font-bold">Ausverkauft</span>
        ) : remaining !== null ? (
          <span className="border border-green-800 px-2 py-1 text-green-400 font-bold">Noch {remaining} Stück</span>
        ) : null}
      </div>

      {product.images && product.images[0] && (
        <Link href={`/shop/produkt/${product.slug}`} className="t-bg mb-5 overflow-hidden border t-border-s block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.images[0]} alt={product.name}
            className="w-full h-auto block grayscale hover:grayscale-0 transition-all duration-300" />
        </Link>
      )}

      <Link href={`/shop/produkt/${product.slug}`} className="block hover:opacity-80 transition">
        <h1 className="text-2xl sm:text-3xl font-black uppercase t-text mb-2 leading-tight">{product.name}</h1>
      </Link>
      <p className="text-xs t-muted mb-3">{product.description}</p>
      <p className="text-lg sm:text-xl font-black t-text mb-4 border-l-4 border-red-600 pl-3">
        {(product.priceCents / 100).toFixed(2)} €
      </p>

      {variants.length > 0 && (
        <select value={variantId ?? ""} onChange={(e) => setVariantId(Number(e.target.value))}
          className="w-full t-input border p-2 mb-3 text-sm">
          {variants.map((v) => (
            <option key={v.id} value={v.id} disabled={v.stock !== null && v.stock <= 0}>
              {v.label} {v.stock !== null && v.stock <= 0 ? "(ausverkauft)" : ""}
            </option>
          ))}
        </select>
      )}

      <button onClick={handleAdd} disabled={loading || soldOut}
        className="block w-full py-4 text-center uppercase font-black tracking-[0.2em] border-[3px] t-border t-text hover:bg-white hover:text-black transition-all text-sm disabled:opacity-50">
        {soldOut ? "Ausverkauft" : added ? "✓ Hinzugefügt" : loading ? "..." : "In den Warenkorb"}
      </button>
    </div>
  );
}
