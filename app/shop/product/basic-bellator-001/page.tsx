import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import BasicBellatorClient from "./BasicBellatorClient";

// Dieses "Drop #1"-Shirt ist die ursprüngliche, fest verdrahtete Landingpage
// des Shops. Der Warenkorb/Checkout läuft inzwischen einheitlich über die
// echten DB-Produkte (siehe app/cart.ts) - damit "Zum Warenkorb hinzufügen"
// hier funktioniert, muss in der DB ein Produkt mit der id 1 existieren
// (genau wie StaticProductCard.tsx auf der Shop-Hauptseite das auch
// voraussetzt). Falls noch nicht angelegt: im Admin-Panel ein Produkt
// "Basic Bellator Shirt" mit Varianten "Schwarz" / "Dunkelgrau" anlegen.
export default async function BasicBellatorPage() {
  const found = await db.select().from(products).where(eq(products.id, 1));
  const variants = found.length > 0
    ? await db.select().from(productVariants).where(eq(productVariants.productId, 1))
    : [];

  return <BasicBellatorClient dbProduct={found[0] ?? null} variants={variants} />;
}
