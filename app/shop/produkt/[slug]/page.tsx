import { db } from "@/db";
import { products, productVariants, productColors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/app/actions";
import { hasPreReleaseAccess } from "@/app/cart";
import ProductDetailClient from "./ProductDetailClient";
import ProductReviewsSection from "./ProductReviewsSection";
import Breadcrumbs from "@/app/components/Breadcrumbs";

// Eindeutiger Title + Meta-Description PRO Produkt (vorher: gar keine
// Metadaten auf Produktseiten - alle hätten mit dem generischen Root-Title
// in Suchergebnissen gelistet). notFound()/inaktive Produkte liefern
// bewusst keine erfundene Beschreibung, sondern Next.js' Standard-404-Meta.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [product] = await db.select().from(products).where(eq(products.slug, slug));
  if (!product) return {};

  const description = product.description.length > 160
    ? product.description.slice(0, 157) + "…"
    : product.description;
  const image = product.images?.[0];

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

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

  // Product-JSON-LD: Preis, Verfügbarkeit und Name strukturiert für Google
  // (Grundlage für Preis-/Verfügbarkeits-Rich-Snippets in der Suche).
  const remaining = product.dropLimit ? product.dropLimit - (product.soldCount ?? 0) : null;
  const soldOut = remaining !== null && remaining <= 0;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(product.images?.[0] ? { image: product.images } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (product.priceCents / 100).toFixed(2),
      availability: soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: `https://mz-dev.de/shop/produkt/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="max-w-[1000px] mx-auto px-4 pt-6 t-text font-mono">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.name },
        ]} />
      </div>
      <ProductDetailClient product={product} variants={variants} colors={sortedColors} isAdmin={isAdmin} />
      <ProductReviewsSection productId={product.id} />
    </>
  );
}
