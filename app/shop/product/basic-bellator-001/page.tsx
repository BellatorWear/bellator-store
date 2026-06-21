'use client'

import { useState } from 'react';
import AddToCartButton from '../../components/AddToCartButton';
import '../../shop-globals.css';

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
    // Hintergrund des Hauptbereichs auf Dunkelgrau/Schwarz, Text auf Hellgrau
    <main style={{ maxWidth: '1000px', margin: '4rem auto', padding: '0 2rem', color: '#ccc' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
        
        {/* Bild-Bereich */}
        <div>
          <div style={{ background: '#333', height: '500px', borderRadius: '4px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #444' }}>
            <img src={activeImage} alt={currentVariant.name} style={{ maxHeight: '100%', objectFit: 'contain' }} />
          </div>
          
          <button 
            onClick={() => setShowBack(!showBack)} 
            style={{ 
              width: '100%', 
              padding: '0.8rem', 
              cursor: 'pointer', 
              background: '#fff', // Weißer Button für maximalen Kontrast
              color: '#000', // Schwarzer Text
              border: 'none', 
              borderRadius: '4px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            {showBack ? 'Vorderseite' : 'Rückseite'}
          </button>
        </div>

        {/* Info-Bereich */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Hellerer Text */}
          <h4 style={{ textTransform: 'uppercase', letterSpacing: '3px', color: '#aaa', margin: '0' }}>Bellators First</h4>
          <h1 style={{ fontSize: '3rem', margin: '0.5rem 0', textTransform: 'uppercase', color: '#fff' }}>{product.name}</h1>
          
          {/* Farbauswahl - Buttons angepasst */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            {(Object.keys(productVariants) as ColorKey[]).map((key) => (
              <button 
                key={key} 
                onClick={() => setActiveColor(key)}
                style={{ 
                  padding: '0.6rem 1.2rem', 
                  // Aktiver Button ist Weiß, inaktiver ist Dunkelgrau
                  border: activeColor === key ? '2px solid #fff' : '1px solid #555',
                  background: activeColor === key ? '#fff' : '#222',
                  color: activeColor === key ? '#000' : '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}
              >
                {productVariants[key].name}
              </button>
            ))}
          </div>

          {/* Preis in Weiß und Fett */}
          <p style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '2rem', color: '#fff' }}>{product.price}</p>
          
          {/* Beschreibung in hellem Grau */}
          <p style={{ lineHeight: '1.7', marginBottom: '2.5rem', fontSize: '1.1rem', color: '#bbb' }}>
            {product.description}
          </p>

          {/* Der pulsierende Kaufbutton */}
          <div style={{ width: '100%', maxWidth: '350px' }}>
            <AddToCartButton productId={`${product.id}-${activeColor}`} />
          </div>
        </div>
      </div>
    </main>
  );
}