import styles from './components/ProductCard.module.css';
import './shop-globals.css';

export default function ShopPage() {
  // Später ziehen wir hier die Daten via Drizzle
  const products = [{ id: 1, name: "Oversized Tee", price: "45.00" }];

  return (
    <main className="shop-container">
      <h1>BELLATOR SHOP</h1>
      <div className="product-grid">
        {products.map(p => (
          <div key={p.id} className={styles.card}>
            <h2>{p.name}</h2>
            <p>{p.price} EUR</p>
            <button className={styles.btn}>Add to Bag</button>
          </div>
        ))}
      </div>
    </main>
  );
}