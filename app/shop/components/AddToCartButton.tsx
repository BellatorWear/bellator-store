'use client'

import { handleAction } from '../../actions';
import styles from './ProductCard.module.css';

export default function AddToCartButton({ productId }: { productId: string }) {
  
  // Der "void" Wrapper: Wir rufen die Action auf, 
  // aber das "return" landet im Nirgendwo.
  const handleFormAction = async (formData: FormData): Promise<void> => {
    await handleAction(formData);
  };

  return (
    <form action={handleFormAction}>
      <input type="hidden" name="actionType" value="addToCart" />
      <input type="hidden" name="productId" value={productId} />
      
      <button type="submit" className={styles.btn}>
        Add to Bag
      </button>
    </form>
  );
}