import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const found = await db.select().from(products).where(eq(products.slug, slug));
  if (found.length === 0 || !found[0].active) notFound();
  const product = found[0];

  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, product.id));

  return <ProductDetailClient product={product} variants={variants} />;
}
