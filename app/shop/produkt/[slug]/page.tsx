import { db } from "@/db";
import { products, productVariants, productColors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { hasPreReleaseAccess } from "@/app/cart";
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

  // Pre-Release-Produkte vor ihrem Drop-Datum: auch über die direkte URL
  // nur für Admins oder User mit gültigem Zugangscode sichtbar (sonst
  // könnte man die Grid-Sperre einfach durch Erraten der URL umgehen).
  if (product.isPreRelease && product.dropDate && new Date(product.dropDate).getTime() > Date.now() && !isAdmin) {
    const access = await hasPreReleaseAccess(user?.id);
    if (!access) notFound();
  }

  const [variants, colors] = await Promise.all([
    db.select().from(productVariants).where(eq(productVariants.productId, product.id)),
    db.select().from(productColors).where(eq(productColors.productId, product.id)),
  ]);
  const sortedColors = colors.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return <ProductDetailClient product={product} variants={variants} colors={sortedColors} isAdmin={isAdmin} />;
}
