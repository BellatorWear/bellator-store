"use client";

import React from "react";

function ViewProductButton({ productId }: { productId: string }) {
  return (
    // Button jetzt hart, ohne abgerundete Ecken, mit massivem Hover-Effekt
    <a
      href={`/shop/product/${productId}`}
      className="block w-full py-4 mt-6 text-center uppercase font-black tracking-[0.2em] border-[3px] border-white text-white hover:bg-white hover:text-black transition-none"
    >
      Details ansehen
    </a>
  );
}

export default function ShopPage() {
  const product = {
    id: "basic-bellator-001",
    name: "Basic Bellator Shirt",
    tagline: "Bellators First Drop",
    price: "35.00 EUR",
  };

  return (
    <main className="min-h-screen flex justify-center items-start p-6 md:p-24">
      {/* 
        Die Card: Border dicker gemacht [3px]
        Shadows: Schatten jetzt in "Bellator-Weiß" statt grau für mehr Kontrast 
      */}
      <div className="w-full max-w-[400px] bg-[#0a0a0a] p-6 border-[3px] border-white shadow-[10px_10px_0px_0px_white] md:shadow-[15px_15px_0px_0px_white]">
        <div className="bg-black mb-6 overflow-hidden border-[1px] border-zinc-800">
          <img
            src="/blackshirt-mockup.png"
            alt={product.name}
            className="w-full h-auto block grayscale hover:grayscale-0 transition-all duration-300"
          />
        </div>

        <h3 className="text-[0.6rem] uppercase tracking-[0.4em] text-zinc-500 mb-1">
          {product.tagline}
        </h3>

        <h1 className="text-3xl font-black uppercase text-white mb-2 leading-[0.9]">
          {product.name}
        </h1>

        <p className="text-xl font-black text-white mb-4 border-l-4 border-red-600 pl-3">
          {product.price}
        </p>

        <ViewProductButton productId={product.id} />
      </div>
    </main>
  );
}
