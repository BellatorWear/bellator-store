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
        background: 'transparent',
        color: '#fff',
        textDecoration: 'none',
        textTransform: 'uppercase',
        fontWeight: '900',
        letterSpacing: '2px',
        textAlign: 'center',
        border: '2px solid #fff',
        transition: 'all 0.3s ease',
        marginTop: '1.5rem',
        boxSizing: 'border-box',
        cursor: 'pointer'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = '#fff';
        e.currentTarget.style.color = '#000';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#fff';
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
    <main style={{ 
      minHeight: '100dvh', 
      width: '100%', 
      background: '#000', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      overflow: 'hidden', // Killt Scrollen komplett
      margin: 0,
      padding: '1rem',
      boxSizing: 'border-box'
    }}>
      
      <div 
        style={{ 
          maxWidth: '400px', 
          width: '100%',
          background: '#111',
          padding: '2rem', 
          border: '2px solid #fff',
          // Schatten etwas kleiner gemacht, damit er nicht über die Screenbreite ragt
          boxShadow: '10px 10px 0px 0px #333', 
          boxSizing: 'border-box'
        }}
      >
        <div style={{ background: '#000', marginBottom: '1.5rem', overflow: 'hidden' }}>
          <img 
            src="/blackshirt-mockup.png" 
            alt={product.name} 
            style={{ width: '100%', height: 'auto', display: 'block' }} 
          />
        </div>
        
        <h3 style={{ textTransform: 'uppercase', letterSpacing: '4px', fontSize: '0.7rem', color: '#888', margin: '0' }}>
          {product.tagline}
        </h3>
        <h1 style={{ fontSize: '2rem', margin: '0.5rem 0 1rem 0', textTransform: 'uppercase', fontWeight: '900', color: '#fff' }}>
          {product.name}
        </h1>
        
        <p style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 1rem 0', color: '#fff' }}>
          {product.price}
        </p>
        
        <ViewProductButton productId={product.id} />
      </div>
    </main>
  );
}