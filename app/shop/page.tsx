import AddToCartButton from './components/AddToCartButton';
import styles from './components/ProductCard.module.css';
import './shop-globals.css';

export default function ShopPage() {
  const product = {
    id: 'basic-bellator-001',
    name: 'Basic Bellator Shirt',
    tagline: 'Bellators First Drop', // Der neue Vibe
    price: '35.00 EUR'
  };

  return (
    <main className="product-grid">
      <div className={styles.card} style={{ padding: '2rem', border: '2px solid #000' }}>
        {/* Größeres Bild-Frame für mehr Präsenz */}
        <div className={styles.imageFrame} style={{ height: '350px', marginBottom: '1.5rem' }} />
        
        {/* Tuffere Schrift durch Text-Transform und stärkeres Gewicht */}
        <h3 style={{ textTransform: 'uppercase', letterSpacing: '2px', color: '#888', margin: '0' }}>
          {product.tagline}
        </h3>
        <h1 style={{ fontSize: '2.5rem', margin: '0.5rem 0 1rem 0', textTransform: 'uppercase' }}>
          {product.name}
        </h1>
        
        <p style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 2rem 0' }}>
          {product.price}
        </p>
        
        <AddToCartButton productId={product.id} />
      </div>
    </main>
  );
}