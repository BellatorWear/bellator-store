import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  // Wichtig: Wir müssen den String in eine Zahl umwandeln, da 'serial' eine Zahl ist
  const idAsNumber = parseInt(productId);

  if (isNaN(idAsNumber)) {
    notFound();
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, idAsNumber), // Hier jetzt die Zahl nutzen
  });

  if (!product) {
    notFound();
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>{product.name}</h1>
      <p>Preis: {product.price / 100} EUR</p> {/* Durch 100, weil es Cent sind */}
      <p>{product.description}</p>
    </main>
  );
}