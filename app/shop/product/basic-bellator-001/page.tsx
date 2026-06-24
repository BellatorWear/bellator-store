"use client";
import { useState } from "react";
import AddToCartButton from "../../components/AddToCartButton";

const productVariants = {
  black: { name: "Schwarz", front: "/black-front.png", back: "/black-back.png" },
  darkgrey: { name: "Dunkelgrau", front: "/grey-front.png", back: "/grey-back.png" },
} as const;

type ColorKey = keyof typeof productVariants;

export default function BasicBellatorPage() {
  const [activeColor, setActiveColor] = useState<ColorKey>("black");
  const [showBack, setShowBack] = useState(false);

  const currentVariant = productVariants[activeColor];
  const activeImage = showBack ? currentVariant.back : currentVariant.front;

  const product = {
    id: "basic-bellator-001",
    name: "Basic Bellator Shirt",
    price: "35.00 EUR",
    description: "Designed for those who never quit. Bellators First Drop.",
  };

  return (
    <main className="t-text font-mono">
      <div className="max-w-[1000px] mx-auto py-8 px-4 md:py-16">

        {/* Zurück */}
        <a href="/shop" className="text-[10px] t-muted uppercase tracking-widest hover:t-text transition mb-8 inline-block">
          ← Zurück zum Shop
        </a>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

          {/* Bild */}
          <div className="flex flex-col">
            <div className="t-card border aspect-square flex items-center justify-center mb-4 overflow-hidden">
              <img src={activeImage} alt={currentVariant.name} className="max-h-full object-contain p-4" />
            </div>
            <button onClick={() => setShowBack(!showBack)}
              className="w-full py-3 t-btn-primary font-black uppercase tracking-widest transition text-sm">
              {showBack ? "Vorderseite" : "Rückseite"}
            </button>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center t-card border p-5 sm:p-6 space-y-5">
            <div>
              <h4 className="text-xs uppercase tracking-[0.3em] t-muted mb-2">Bellators First Drop</h4>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase t-text leading-tight">{product.name}</h1>
            </div>

            {/* Key Facts */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-400 border border-yellow-700 px-3 py-1.5 w-fit">240g Heavy Cotton</span>
              <span className="text-[10px] uppercase tracking-widest font-bold t-text border t-border px-3 py-1.5 w-fit">Oversized Fit</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-red-400 border border-red-700 px-3 py-1.5 w-fit">Strictly Limited — 10 Pieces</span>
            </div>

            {/* Farbauswahl */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(productVariants) as ColorKey[]).map((key) => (
                <button key={key} onClick={() => setActiveColor(key)}
                  className={`px-4 py-2 text-xs sm:text-sm font-bold uppercase transition ${
                    activeColor === key ? "t-btn-primary" : "t-btn-outline"
                  }`}>
                  {productVariants[key].name}
                </button>
              ))}
            </div>

            <p className="text-2xl sm:text-3xl font-black t-text">{product.price}</p>
            <p className="leading-relaxed text-sm t-muted">{product.description}</p>

            <AddToCartButton productId={`${product.id}-${activeColor}`} />
          </div>
        </div>
      </div>
    </main>
  );
}
