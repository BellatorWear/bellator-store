'use client'

export default function AddToCartButton({ productId }: { productId: string }) {
  return (
    <button 
      onClick={() => alert("Klick funktioniert!")}
      style={{ 
        position: 'fixed', 
        top: '20px', 
        left: '20px', 
        padding: '20px', 
        background: 'red',
        zIndex: 99999
      }}
    >
      TEST BUTTON - KLICK MICH
    </button>
  );
}
