import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import StaticProductCard from "./StaticProductCard";
import DbProductCard from "./DbProductCard";
import { getSetting, COUNTDOWN_KEY, COUNTDOWN_DEFAULT } from "@/app/utils/settings";

export default async function ShopPage() {
  // Produkt id=1 ist das fest verdrahtete "Basic Bellator Shirt" (siehe
  // StaticProductCard) - wird hier separat geladen, damit Preis/Rabatt/
  // Lagerbestand nicht mehr hardcodiert sind, sondern aus der DB kommen.
  const [staticProductRows, dbProducts, countdown] = await Promise.all([
    db.select().from(products).where(eq(products.id, 1)),
    db.select().from(products).where(eq(products.active, true)),
    getSetting(COUNTDOWN_KEY, COUNTDOWN_DEFAULT),
  ]);
  const staticProduct = staticProductRows[0] ?? null;

  // Alle anderen, "normalen" Produkte (id=1 wird ja schon über
  // StaticProductCard gezeigt, nicht zweimal anzeigen).
  const otherProducts = dbProducts.filter((p) => p.id !== 1);
  const allVariants = otherProducts.length > 0 ? await db.select().from(productVariants) : [];

  return (
    <main className="min-h-screen px-4 pt-4 pb-12 md:pt-6 md:pb-16">
      <div className="flex flex-col items-center mb-8">
        <StaticProductCard countdown={countdown} dbProduct={staticProduct} />
      </div>

      {/* Responsive Grid statt Untereinander-Liste: 1 Spalte auf kleinen
          Handys, 2 ab ~480px, 3 ab Tablet, 4 ab großem Desktop. */}
      {otherProducts.length > 0 && (
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-[1600px] mx-auto">
          {otherProducts.map((p) => (
            <DbProductCard
              key={p.id}
              product={p}
              variants={allVariants.filter((v) => v.productId === p.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
