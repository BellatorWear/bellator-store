import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [found, user] = await Promise.all([
    db.select().from(products).where(eq(products.slug, slug)),
    getCurrentUser(),
  ]);
  const isAdmin = !!user?.isAdmin;

  // Admins dürfen auch inaktive Produkte sehen (z.B. direkt nach dem
  // Anlegen, bevor der Drop live geht) - normale Besucher bekommen wie
  // bisher eine 404.
  if (found.length === 0 || (!found[0].active && !isAdmin)) notFound();
  const product = found[0];

  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, product.id));

  return <ProductDetailClient product={product} variants={variants} isAdmin={isAdmin} />;
}
