"use client";
import { useState, useMemo } from "react";
import DbProductCard from "../DbProductCard";

type ProductWithExtras = {
  id: number;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  images: string[] | null;
  dropLabel: string | null;
  dropLimit: number | null;
  soldCount: number | null;
  category: string | null;
  gender: string | null;
  collection: string | null;
  isPreReleaseActive: boolean;
  variants: { id: number; label: string; stock: number | null }[];
  colors: { id: number; name: string; hexColor: string; frontImage: string; backImage: string }[];
};

const CATEGORIES = [
  { value: "", label: "Alle" },
  { value: "shirt", label: "Shirts" },
  { value: "hoodie", label: "Hoodies" },
  { value: "ziphoodie", label: "Zip-Hoodies" },
  { value: "pants", label: "Hosen" },
  { value: "set", label: "Sets" },
];

const GENDERS = [
  { value: "", label: "Für alle" },
  { value: "male", label: "Männlich" },
  { value: "female", label: "Weiblich" },
];

export default function ShopFilters({ products, collections }: { products: ProductWithExtras[]; collections: string[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [collection, setCollection] = useState("");

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (query) {
        const q = query.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) return false;
      }
      if (category && p.category !== category) return false;
      if (gender) {
        // "unisex" wird bei jedem Geschlechter-Filter angezeigt
        if (p.gender !== gender && p.gender !== "unisex") return false;
      }
      if (collection && p.collection !== collection) return false;
      return true;
    });
  }, [products, query, category, gender, collection]);

  const activeFilters = [category, gender, collection].filter(Boolean).length;

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Filter-Leiste */}
      <div className="mb-6 space-y-3">
        {/* Suche */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Produkte suchen..."
            className="w-full bg-zinc-900/80 border border-zinc-700 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-white outline-none transition"
          />
        </div>

        {/* Kategorie-Reiter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                category === c.value ? "bg-white text-black border-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
              }`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Geschlecht + Collection in einer Zeile */}
        <div className="flex flex-wrap gap-2 items-center">
          {GENDERS.map(g => (
            <button key={g.value} onClick={() => setGender(g.value)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                gender === g.value ? "bg-white text-black border-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
              }`}>
              {g.label}
            </button>
          ))}
          {collections.length > 0 && (
            <select value={collection} onChange={e => setCollection(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:border-zinc-500 focus:border-white outline-none transition cursor-pointer">
              <option value="">Alle Collections</option>
              {collections.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {activeFilters > 0 && (
            <button onClick={() => { setCategory(""); setGender(""); setCollection(""); setQuery(""); }}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-red-800 text-red-500 hover:bg-red-900/30 transition-all">
              Filter zurücksetzen ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* Ergebnisse */}
      {filtered.length === 0 ? (
        <div className="border border-zinc-800 bg-black/60 p-12 text-center">
          <p className="text-xs text-zinc-600 uppercase tracking-widest">Keine Produkte gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(p => (
            <DbProductCard
              key={p.id}
              product={p}
              variants={p.variants}
              colors={p.colors}
              isPreRelease={p.isPreReleaseActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
