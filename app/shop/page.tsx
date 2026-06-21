'use client'

import React from 'react';
import './shop-globals.css';

function ViewProductButton({ productId }: { productId: string }) {
  return (
    <a
      href={`/shop/product/${productId}`}
      style={{
        display: 'block',
        padding: '1.2rem',
        background: '#fff', // Button in Weiß
        color: '#000',      // Text in Schwarz
        textDecoration: 'none',
        textTransform: 'uppercase',
        fontWeight: '900',
        letterSpacing: '2px',
        textAlign: 'center',
        border: '2px solid #000',
        transition: 'all 0.2s ease',
        marginTop: '1rem'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = '#000';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = '#fff';
        e.currentTarget.style.color = '#000';
      }}
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
    <main style={{ padding: '4rem 2rem', background: '#f4f4f4', minHeight: '100vh' }}>
      <div 
        style={{ 
          maxWidth: '400px', 
          background: '#fff', 
          padding: '1.5rem', 
          border: '4px solid #000', // Dickerer Rahmen für den "Zine-Look"
          boxShadow: '10px 10px 0px 0px #000' // Brutalistischer Shadow-Effekt
        }}
      >
        {/* Bild-Bereich: Hier ist dein Image */}
        <div style={{ background: '#eee', marginBottom: '1.5rem', overflow: 'hidden' }}>
          <img 
            src="/blackshirt-mockup.png" 
            alt={product.name} 
            style={{ width: '100%', height: 'auto', display: 'block' }} 
          />
        </div>
        
        <h3 style={{ textTransform: 'uppercase', letterSpacing: '4px', fontSize: '0.8rem', color: '#666', margin: '0' }}>
          {product.tagline}
        </h3>
        <h1 style={{ fontSize: '2rem', margin: '0.5rem 0 1rem 0', textTransform: 'uppercase', fontWeight: '900' }}>
          {product.name}
        </h1>
        
        <p style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 1rem 0' }}>
          {product.price}
        </p>
        
        <ViewProductButton productId={product.id} />
      </div>
    </main>
  );
}