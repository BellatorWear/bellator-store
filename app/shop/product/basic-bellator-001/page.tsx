'use client'

import AddToCartButton from '../../components/AddToCartButton';
import '../../shop-globals.css';

export default function BasicBellatorPage() {
  const product = {
    id: 'basic-bellator-001',
    name: 'Basic Bellator Shirt',
    price: '35.00 EUR', // Preis wieder auf 35 EUR
    description: '240g Heavy Cotton. Oversized Fit. Designed for those who never quit. Bellators First Drop.',
  };

  return (
    <main style={{ maxWidth: '1000px', margin: '4rem auto', padding: '0 2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
        
        {/* Bild-Bereich */}
        <div style={{ background: '#eee', height: '500px', borderRadius: '4px' }} />

        {/* Info-Bereich */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ textTransform: 'uppercase', letterSpacing: '3px', color: '#666', margin: '0' }}>Bellators First</h4>
          <h1 style={{ fontSize: '3rem', margin: '0.5rem 0', textTransform: 'uppercase' }}>{product.name}</h1>
          
          {/* Preis-Hervorhebung */}
          <p style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '2rem', color: '#000' }}>
            {product.price}
          </p>
          
          <p style={{ lineHeight: '1.6', marginBottom: '2rem', fontSize: '1.1rem', color: '#333' }}>
            {product.description}
          </p>

          {/* Der pulsierende Kaufbutton */}
          <div style={{ width: '100%', maxWidth: '300px' }}>
            <AddToCartButton productId={product.id} />
          </div>
        </div>
      </div>
    </main>
  );
}