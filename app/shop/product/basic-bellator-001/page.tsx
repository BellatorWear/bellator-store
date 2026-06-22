'use client'

import { useState } from 'react';
import AddToCartButton from '../../components/AddToCartButton';

const productVariants = {
  black: { name: 'Schwarz', front: '/black-front.png', back: '/black-back.png' },
  darkgrey: { name: 'Dunkelgrau', front: '/grey-front.png', back: '/grey-back.png' }
} as const;

type ColorKey = keyof typeof productVariants;

export default function BasicBellatorPage() {
  const [activeColor, setActiveColor] = useState<ColorKey>('black');
  const [showBack, setShowBack] = useState(false);

  const product = {
    id: 'basic-bellator-001',
    name: 'Basic Bellator Shirt',
    price: '35.00 EUR',
    description: '240g Heavy Cotton. Oversized Fit. Designed for those who never quit. Bellators First Drop.',
  };

  const currentVariant = productVariants[activeColor];
  const activeImage = showBack ? currentVariant.back : currentVariant.front;

  return (
    // Responsive Padding und zentrierter Container
    <main className="max-w-[1000px] mx-auto py-8 px-4 md:py-16 text-[#ccc]">
      
      {/* Grid: Auf Mobile untereinander, auf Desktop nebeneinander */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
        
        {/* Bild-Bereich */}
        <div className="flex flex-col">
          <div className="bg-[#111] aspect-square flex items-center justify-center border border-[#333] mb-4 overflow-hidden">
            <img src={activeImage} alt={currentVariant.name} className="max-h-full object-contain p-4" />
          </div>
          
          <button 
            onClick={() => setShowBack(!showBack)} 
            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest hover:bg-zinc-200 transition"
          >
            {showBack ? 'Vorderseite' : 'Rückseite'}
          </button>
        </div>

        {/* Info-Bereich */}
        <div className="flex flex-col justify-center">
          <h4 className="text-xs uppercase tracking-[0.3em] text-[#888] mb-2">Bellators First</h4>
          <h1 className="text-4xl md:text-5xl font-black uppercase text-white mb-6 leading-tight">{product.name}</h1>
          
          {/* Farbauswahl */}
          <div className="flex gap-3 mb-8">
            {(Object.keys(productVariants) as ColorKey[]).map((key) => (
              <button 
                key={key} 
                onClick={() => setActiveColor(key)}
                className={`px-6 py-3 text-sm font-bold uppercase transition ${
                  activeColor === key ? 'bg-white text-black' : 'bg-[#111] border border-[#333] text-white hover:border-white'
                }`}
              >
                {productVariants[key].name}
              </button>
            ))}
          </div>

          <p className="text-3xl font-black text-white mb-6">{product.price}</p>
          
          <p className="leading-relaxed mb-8 text-base text-[#aaa]">
            {product.description}
          </p>

          <div className="w-full">
            <AddToCartButton productId={`${product.id}-${activeColor}`} />
          </div>
        </div>
      </div>
    </main>
  );
}