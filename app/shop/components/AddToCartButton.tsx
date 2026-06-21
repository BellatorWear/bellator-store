'use client'

import { handleAction } from '@/app/actions';
import styles from './ProductCard.module.css';

export default function AddToCartButton({ productId }: { productId: string }) {
  
  const handleAddToCart = async () => {
    try {
      const formData = new FormData();
      formData.append('actionType', 'addToCart');
      formData.append('productId', productId);
      
      const result = await handleAction(formData);
      
      if (result.success) {
        alert("Produkt im Warenkorb!");
      } else {
        alert("Fehler: " + (result.error || "Unbekannter Fehler"));
      }
    } catch (error) {
      console.error("Fehler:", error);
      alert("Ein Fehler ist aufgetreten.");
    }
  };

  return (
    <button 
      onClick={handleAddToCart} 
      className={styles.btn}
      style={{ cursor: 'pointer', zIndex: 1000 }}
    >
      Add to Bag
    </button>
  );
}