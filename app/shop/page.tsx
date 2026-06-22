'use client'

import React from 'react';

function ViewProductButton({ productId }: { productId: string }) {
  return (
    <a
      href={`/shop/product/${productId}`}
      className="block w-full py-4 mt-6 text-center uppercase font-black tracking-[0.2em] border-2 border-white text-white transition-all duration-300 hover:bg-white hover:text-black"
    >
      Details ansehen
    </a>
  );
}

export default function ShopPage() {
  const product = {
    id: 'basic-bellator-001',
    name: 'Basic Bellator Shirt',
    tagline: 'Bellators First Drop',
    price: '35.00 EUR'
  };

  return (
    // min-h-screen mit Padding, das auf Mobile kleiner ist
    <main className="min-h-screen bg-black flex justify-center items-start p-4 md:p-24">
      
      {/* Produktblock: Breite auf Mobile 100%, auf Desktop max 400px */}
      <div className="w-full max-w-[400px] bg-[#111] p-6 border-2 border-white shadow-[10px_10px_0px_0px_#333] md:shadow-[15px_15px_0px_0px_#333]">
        
        <div className="bg-black mb-6 overflow-hidden">
          <img 
            src="/blackshirt-mockup.png" 
            alt={product.name} 
            className="w-full h-auto block" 
          />
        </div>
        
        <h3 className="text-[0.6rem] uppercase tracking-[0.4em] text-[#888] mb-1">
          {product.tagline}
        </h3>
        <h1 className="text-2xl md:text-3xl font-black uppercase text-white mb-2 leading-none">
          {product.name}
        </h1>
        
        <p className="text-xl font-black text-white mb-4">
          {product.price}
        </p>
        
        <ViewProductButton productId={product.id} />
      </div>
    </main>
  );
}