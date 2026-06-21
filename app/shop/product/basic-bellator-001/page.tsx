'use client'

import { useState } from 'react';
import AddToCartButton from '../../components/AddToCartButton';
import '../../shop-globals.css';

// 1. Definiere den Typ für die Farben, um TypeScript glücklich zu machen
const productVariants = {
  black: {
    name: 'Schwarz',
    front: '/black-front.png',
    back: '/black-back.png'
  },
  darkgrey: {
    name: 'Dunkelgrau',
    front: '/grey-front.png',
    back: '/grey-back.png'
  }
} as const; // 'as const' macht das Objekt unveränderlich für TS

// Hier leiten wir den Typ automatisch aus dem Objekt ab
type ColorKey = keyof typeof productVariants;

export default function BasicBellatorPage() {
  // Jetzt weiß TypeScript genau, dass activeColor nur 'black' oder 'darkgrey' sein darf
  const [activeColor, setActiveColor] = useState<ColorKey>('black');
  const [showBack, setShowBack] = useState(false);

  const product = {
    id: 'basic-bellator-001',
    name: 'Basic Bellator Shirt',
    price: '35.00 EUR',
    description: '240g Heavy Cotton. Oversized Fit. Designed for those who never quit. Bellators First Drop.',
  };

  // Dank 'as const' und dem Typ ist das jetzt sicher und ohne rote Fehler
  const currentVariant = productVariants[activeColor];
  const activeImage = showBack ? currentVariant.back : currentVariant.front;

  return (
    <main style={{ maxWidth: '1000px', margin: '4rem auto', padding: '0 2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
        
        {/* Bild-Bereich */}
        <div>
          <div style={{ background: '#eee', height: '500px', borderRadius: '4px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={activeImage} alt={currentVariant.name} style={{ maxHeight: '100%', objectFit: 'contain' }} />
          </div>
          
          <button 
            onClick={() => setShowBack(!showBack)} 
            style={{ width: '100%', padding: '0.8rem', cursor: 'pointer', background: '#000', color: '#fff', border: 'none', borderRadius: '4px' }}
          >
            {showBack ? 'Vorderseite zeigen' : 'Rückseite zeigen'}
          </button>
        </div>

        {/* Info-Bereich */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ textTransform: 'uppercase', letterSpacing: '3px', color: '#666', margin: '0' }}>Bellators First</h4>
          <h1 style={{ fontSize: '3rem', margin: '0.5rem 0', textTransform: 'uppercase' }}>{product.name}</h1>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            {(Object.keys(productVariants) as ColorKey[]).map((key) => (
              <button 
                key={key} 
                onClick={() => setActiveColor(key)}
                style={{ 
                  padding: '0.5rem 1rem', 
                  border: activeColor === key ? '2px solid #000' : '1px solid #ccc',
                  background: activeColor === key ? '#000' : '#fff',
                  color: activeColor === key ? '#fff' : '#000',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {productVariants[key].name}
              </button>
            ))}
          </div>

          <p style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '2rem', color: '#000' }}>{product.price}</p>
          
          <p style={{ lineHeight: '1.6', marginBottom: '2rem', fontSize: '1.1rem', color: '#333' }}>
            {product.description}
          </p>

          <div style={{ width: '100%', maxWidth: '300px' }}>
            <AddToCartButton productId={`${product.id}-${activeColor}`} />
          </div>
        </div>
      </div>
    </main>
  );
}