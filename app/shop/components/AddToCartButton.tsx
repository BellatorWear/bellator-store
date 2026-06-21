'use client'

import { handleAction } from '../../actions';

export default function AddToCartButton({ productId }: { productId: string }) {
  return (
    <form action={handleAction}>
      <input type="hidden" name="actionType" value="addToCart" />
      <input type="hidden" name="productId" value={productId} />
      
      {/* Test-Button: Wenn der funktioniert, ist dein CSS der Schuldige */}
      <button 
        type="submit" 
        style={{ 
          background: 'red', 
          padding: '20px', 
          cursor: 'pointer',
          position: 'relative',
          zIndex: 9999 
        }}
      >
        TEST ADD TO BAG
      </button>
    </form>
  );
}