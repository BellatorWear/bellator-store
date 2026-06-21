'use client' // WICHTIG: Das muss nach ganz oben, weil das Teil im Browser laufen soll

import { handleAction } from '../../actions';
import styles from './ProductCard.module.css';

export default function AddToCartButton({ productId }: { productId: string }) {
  async function onSubmit(formData: FormData) {
    await handleAction(formData);
  }

  return (
    <form action={onSubmit}>
      {/* Wir schicken die Daten an die zentrale Server-Action */}
      <input type="hidden" name="actionType" value="addToCart" />
      <input type="hidden" name="productId" value={productId} />
      
      <button type="submit" className={styles.btn}>
        Add to Bag
      </button>
    </form>
  );
}