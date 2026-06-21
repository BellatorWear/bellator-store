'use client'

export default function AddToCartButton({ productId }: { productId: string }) {
  const stripeLink = "https://buy.stripe.com/bJe4gr5aPbaJb9W29w2Ji00";

  return (
    <a 
      href={stripeLink} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{
        display: 'inline-block',
        backgroundColor: '#000',
        color: '#fff',
        padding: '1.2rem 2.5rem',
        fontSize: '1.2rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        textDecoration: 'none',
        border: '2px solid #000',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        animation: 'pulse 2s infinite',
        textAlign: 'center',
        width: '100%'
      }}
    >
      Jetzt Bellator sichern 🛒
    </a>
  );
}