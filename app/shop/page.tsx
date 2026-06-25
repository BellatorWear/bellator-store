import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import StaticProductCard from "./StaticProductCard";
import DbProductCard from "./DbProductCard";

export default async function ShopPage() {
  const dbProducts = await db.select().from(products).where(eq(products.active, true));
  const allVariants = dbProducts.length > 0 ? await db.select().from(productVariants) : [];

  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-4 py-12 md:p-24 gap-8">
      <StaticProductCard />

      {dbProducts.map((p) => (
        <DbProductCard
          key={p.id}
          product={p}
          variants={allVariants.filter((v) => v.productId === p.id)}
        />
      ))}
    </main>
  );
}
