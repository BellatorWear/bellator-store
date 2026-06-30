import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

// Alte URL von früher, als das Shirt noch hardgecodet war. Damit alte
// Links/Bookmarks (oder z.B. ein QR-Code auf einem gedruckten Produkt-Tag)
// nicht ins Leere laufen, wird hierhin auf die jetzige, echte Produktseite
// weitergeleitet, statt einfach eine 404 zu zeigen. Sucht über den festen
// Slug 'basic-bellator-shirt' (von der Migration vergeben), NICHT über
// eine bestimmte id - die id hängt davon ab, was vorher schon in der DB
// angelegt wurde und ist daher nicht verlässlich.
export default async function LegacyBasicBellatorRedirect() {
  const found = await db.select({ slug: products.slug }).from(products).where(eq(products.slug, "basic-bellator-shirt"));
  if (found.length === 0) notFound();
  redirect(`/shop/produkt/${found[0].slug}`);
}
