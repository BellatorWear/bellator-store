import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  // 1. Umwandlung, da deine DB 'serial' (Zahl) erwartet
  const idAsNumber = parseInt(productId);

  if (isNaN(idAsNumber)) {
    return <div style={{ padding: '2rem' }}>Ungültige Produkt-ID: {productId}</div>;
  }

  // 2. Produkt aus der DB holen
  const product = await db.query.products.findFirst({
    where: eq(products.id, idAsNumber),
  });

  // 3. Fallback, falls ID nicht in der DB existiert
  if (!product) {
    notFound();
  }

  // 4. Anzeige
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{product.name}</h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        Preis: {(product.price / 100).toFixed(2)} EUR
      </p>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Beschreibung</h3>
        <p>{product.description}</p>
      </div>

      <button 
        style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
        onClick={() => alert("Warenkorb-Funktion folgt!")}
      >
        In den Warenkorb
      </button>
    </main>
  );
}