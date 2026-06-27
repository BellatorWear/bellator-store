'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/app/cart";

export default function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("productId", productId);
      fd.append("quantity", "1");
      const res = await addToCart(fd);
      if (res?.error) {
        setErr(res.error);
      } else {
        setAdded(true);
        router.refresh();
        setTimeout(() => setAdded(false), 2000);
      }
    } catch (e) {
      console.error("Add to cart fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="block w-full py-4 text-center uppercase font-black tracking-[0.2em] border-[3px] t-border t-text hover:bg-white hover:text-black transition-all duration-200 text-sm disabled:opacity-50"
      >
        {loading ? "..." : added ? "✓ Hinzugefügt" : "Zum Warenkorb hinzufügen"}
      </button>
      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest mt-2">{err}</p>}
    </div>
  );
}
