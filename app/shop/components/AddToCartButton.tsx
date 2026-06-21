'use client'

import { handleAction } from '@/app/actions';
import styles from './ProductCard.module.css';

export default function AddToCartButton({ productId }: { productId: string }) {
  
  const handleAddToCart = async () => {
    try {
      console.log("Klick registriert für:", productId);
      
      // Wir erstellen manuell die FormData, die deine Server-Action erwartet
      const formData = new FormData();
      formData.append('actionType', 'addToCart');
      formData.append('productId', productId);
      
      // Jetzt rufen wir die Action korrekt auf
      const result = await handleAction(formData);
      
      console.log("Ergebnis vom Server:", result);
      
      if (result.success) {
        alert("Produkt im Warenkorb!");
      } else {
        console.error("Fehler von der Action:", result.error);
      }
      
    } catch (error) {
      console.error("Kritischer Fehler:", error);
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