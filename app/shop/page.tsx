import ViewProductButton from '../../components/ViewProductButton'; // Neu importiert
import styles from './components/ProductCard.module.css';
import './shop-globals.css';

export default function ShopPage() {
  const product = {
    id: 'basic-bellator-001',
    name: 'Basic Bellator Shirt',
    tagline: 'Bellators First Drop',
    price: '35.00 EUR'
  };

  return (
    <main className="product-grid">
      <div className={styles.card} style={{ padding: '2rem', border: '2px solid #000' }}>
        {/* Größeres Bild-Frame */}
        <div className={styles.imageFrame} style={{ height: '350px', marginBottom: '1.5rem' }} />
        
        <h3 style={{ textTransform: 'uppercase', letterSpacing: '2px', color: '#888', margin: '0' }}>
          {product.tagline}
        </h3>
        <h1 style={{ fontSize: '2.5rem', margin: '0.5rem 0 1rem 0', textTransform: 'uppercase' }}>
          {product.name}
        </h1>
        
        <p style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 2rem 0' }}>
          {product.price}
        </p>
        
        {/* Hier jetzt der Button zur Detailseite statt direkt zum Kauf */}
        <ViewProductButton productId={product.id} />
      </div>
    </main>
  );
}