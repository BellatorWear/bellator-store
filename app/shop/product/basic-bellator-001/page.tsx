"use client";
import { useState, useEffect, useRef } from "react";
import AddToCartButton from "../../components/AddToCartButton";

const productVariants = {
  black: { name: "Schwarz", front: "/black-front.png", back: "/black-back.png" },
  darkgrey: { name: "Dunkelgrau", front: "/grey-front.png", back: "/grey-back.png" },
} as const;

type ColorKey = keyof typeof productVariants;

export default function BasicBellatorPage() {
  const [activeColor, setActiveColor] = useState<ColorKey>("black");
  const [showBack, setShowBack] = useState(false);
  const [zoom, setZoom] = useState(0); // 0-1
  const heroRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);

  // Scroll-Trigger: Poser-Bild zoomt in Produkt-Bild
  useEffect(() => {
    function onScroll() {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / (rect.height * 0.6)));
      setZoom(progress);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const currentVariant = productVariants[activeColor];
  const activeImage = showBack ? currentVariant.back : currentVariant.front;

  const product = {
    id: "basic-bellator-001",
    name: "Basic Bellator Shirt",
    price: "35.00 EUR",
    description: "240g Heavy Cotton. Oversized Fit. Designed for those who never quit. Bellators First Drop.",
  };

  return (
    <main className="t-text font-mono">

      {/* HERO - Zoom-Scroll-Trigger */}
      <div ref={heroRef} className="relative h-[100vh] overflow-hidden flex items-center justify-center">
        {/* Hintergrundbild (Skater/Poster-Foto) */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("/background.png")',
            transform: `scale(${1 + zoom * 0.3})`,
            filter: `brightness(${1 - zoom * 0.6})`,
            transition: "transform 0.05s linear",
          }}
        />
        {/* Produktbild blendet ein */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: zoom, transition: "opacity 0.05s linear" }}
        >
          <img
            src={activeImage}
            alt={product.name}
            className="max-h-[70vh] max-w-[70vw] object-contain drop-shadow-2xl"
            style={{ transform: `scale(${0.6 + zoom * 0.4})`, transition: "transform 0.05s linear" }}
          />
        </div>
        {/* Scroll-Hinweis */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-[10px] uppercase tracking-widest"
          style={{ opacity: 1 - zoom * 3 }}
        >
          ↓ Scroll
        </div>
      </div>

      {/* PRODUKT DETAILS */}
      <div ref={productRef} className="max-w-[1000px] mx-auto py-12 px-4 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">

          {/* Bild */}
          <div className="flex flex-col">
            <div className="t-card border aspect-square flex items-center justify-center mb-4 overflow-hidden">
              <img src={activeImage} alt={currentVariant.name} className="max-h-full object-contain p-4" />
            </div>
            <button
              onClick={() => setShowBack(!showBack)}
              className="w-full py-3 t-btn-primary font-black uppercase tracking-widest transition"
            >
              {showBack ? "Vorderseite" : "Rückseite"}
            </button>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center t-card border p-6 space-y-6">
            <div>
              <h4 className="text-xs uppercase tracking-[0.3em] t-muted mb-2">Bellators First Drop</h4>
              <h1 className="text-4xl md:text-5xl font-black uppercase t-text leading-tight">{product.name}</h1>
            </div>

            {/* Key Facts */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-400 border border-yellow-700 px-3 py-1.5 w-fit">240g Heavy Cotton</span>
              <span className="text-[10px] uppercase tracking-widest font-bold t-text border t-border px-3 py-1.5 w-fit">Oversized Fit</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-red-400 border border-red-700 px-3 py-1.5 w-fit">Strictly Limited — 10 Pieces</span>
            </div>

            {/* Farbauswahl */}
            <div className="flex gap-3">
              {(Object.keys(productVariants) as ColorKey[]).map((key) => (
                <button key={key} onClick={() => setActiveColor(key)}
                  className={`px-5 py-2 text-sm font-bold uppercase transition ${
                    activeColor === key ? "t-btn-primary" : "t-btn-outline"
                  }`}>
                  {productVariants[key].name}
                </button>
              ))}
            </div>

            <p className="text-3xl font-black t-text">{product.price}</p>
            <p className="leading-relaxed text-sm t-muted">{product.description}</p>

            <AddToCartButton productId={`${product.id}-${activeColor}`} />
          </div>
        </div>
      </div>
    </main>
  );
}
