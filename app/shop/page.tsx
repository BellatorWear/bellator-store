import styles from './components/ProductCard.module.css';
import './shop-globals.css';

export default function ShopPage() {
  return (
    <main className="product-grid">
      <div className={styles.card}>
        <div className={styles.imageFrame} />
        <h2 style={{ margin: '0 0 0.5rem 0' }}>Oversized Tee</h2>
        <p style={{ margin: '0 0 1.5rem 0' }}>45.00 EUR</p>
        <button className={styles.btn}>Add to Bag</button>
      </div>
    </main>
  );
}