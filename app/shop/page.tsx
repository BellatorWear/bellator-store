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
        background: 'transparent', // Transparent für den "Outline"-Look
        color: '#fff',             // Schrift weiß
        textDecoration: 'none',
        textTransform: 'uppercase',
        fontWeight: '900',
        letterSpacing: '2px',
        textAlign: 'center',
        border: '2px solid #fff',  // Weißer Rahmen
        transition: 'all 0.3s ease',
        marginTop: '1.5rem'
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
    // Ganze Seite schwarz
    <main style={{ padding: '6rem 2rem', background: '#000', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      
      {/* Produktblock zentriert */}
      <div 
        style={{ 
          maxWidth: '400px', 
          width: '100%',
          background: '#111', // Dunkles Grau für Kontrast zum Black-BG
          padding: '2rem', 
          border: '2px solid #fff', // Weißer Rahmen
          boxShadow: '15px 15px 0px 0px #333' // Grauer Schatten für Tiefe
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