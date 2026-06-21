'use client'

import Link from 'next/link';

export default function ViewProductButton({ productId }: { productId: string }) {
  return (
    <Link 
      href={`/shop/product/${productId}`}
      style={{
        display: 'block',
        backgroundColor: '#000',
        color: '#fff',
        padding: '1.2rem 2.5rem',
        fontSize: '1.2rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        textDecoration: 'none',
        border: '2px solid #000',
        cursor: 'pointer',
        textAlign: 'center',
        width: '100%'
      }}
    >
      Details ansehen 🔍
    </Link>
  );
}