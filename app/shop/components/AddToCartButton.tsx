'use client'

import { handleAction } from '../../actions';
import styles from './ProductCard.module.css';

export default function AddToCartButton({ productId }: { productId: string }) {
  return (
    // Der Wrapper () => handleAction(formData) löst das Problem
    <form action={async (formData) => { await handleAction(formData) }}>
      <input type="hidden" name="actionType" value="addToCart" />
      <input type="hidden" name="productId" value={productId} />
      
      <button type="submit" className={styles.btn}>
        Add to Bag
      </button>
    </form>
  );
}