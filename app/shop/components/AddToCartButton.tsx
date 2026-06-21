'use client'

import { handleAction } from '../../actions';
import styles from './ProductCard.module.css';

export default function AddToCartButton({ productId }: { productId: string }) {
  // Wir definieren die Action als direkte Form-Action
  // Next.js erwartet, dass die Funktion, die an action übergeben wird, 
  // die FormData als erstes Argument akzeptiert.
  
  return (
    <form action={handleAction}>
      <input type="hidden" name="actionType" value="addToCart" />
      <input type="hidden" name="productId" value={productId} />
      
      <button type="submit" className={styles.btn}>
        Add to Bag
      </button>
    </form>
  );
}