import AddToCartButton from './components/AddToCartButton';
import styles from './components/ProductCard.module.css';
import './shop-globals.css';

export default function ShopPage() {
  // Hier kannst du später eine Liste von Produkten mappen
  const product = {
    id: 'oversized-tee-001',
    name: 'Oversized Tee',
    price: '45.00 EUR'
  };

  return (
    <main className="product-grid">
      <div className={styles.card}>
        <div className={styles.imageFrame} />
        
        <h2 style={{ margin: '0 0 0.5rem 0' }}>{product.name}</h2>
        <p style={{ margin: '0 0 1.5rem 0' }}>{product.price}</p>
        
        {/* Hier wird die Logik aus der AddToCartButton.tsx geladen */}
        <AddToCartButton productId={product.id} />
      </div>
    </main>
  );
}