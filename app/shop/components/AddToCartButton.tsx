'use client'

import { useRouter } from 'next/navigation';
import styles from './ProductCard.module.css';

export default function AddToCartButton({ productId }: { productId: string }) {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.push(`/shop/product/${productId}`)}
      className={styles.btn}
      style={{ cursor: 'pointer', zIndex: 1000 }}
    >
      Details ansehen
    </button>
  );
}