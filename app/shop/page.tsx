import { db } from "@/db";
import { products, productVariants, productColors } from "@/db/schema";
import { eq } from "drizzle-orm";
import DbProductCard from "./DbProductCard";
import CountdownBanner from "./components/CountdownBanner";
import ShopFilters from "./components/ShopFilters";
import { getSetting, COUNTDOWN_KEY, COUNTDOWN_DEFAULT } from "@/app/utils/settings";
import { getCurrentUser } from "@/app/actions";
import { hasPreReleaseAccess } from "@/app/cart";

export default async function ShopPage() {
  const [dbProducts, allVariants, allColors, countdownSetting, user] = await Promise.all([
    db.select().from(products).where(eq(products.active, true)),
    db.select().from(productVariants),
    db.select().from(productColors),
    getSetting(COUNTDOWN_KEY, COUNTDOWN_DEFAULT),
    getCurrentUser(),
  ]);
  const hasAccess = await hasPreReleaseAccess(user?.id);

  const now = Date.now();
  const visibleProducts = dbProducts.filter((p) => {
    if (!p.isPreRelease) return true;
    const dropPassed = p.dropDate ? new Date(p.dropDate).getTime() <= now : true;
    return dropPassed || hasAccess;
  });

  let countdown = countdownSetting;
  if (!countdown.enabled) {
    const upcomingDropDates = dbProducts
      .map((p) => p.dropDate)
      .filter((d): d is Date => !!d && new Date(d).getTime() > now)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    if (upcomingDropDates.length > 0) {
      countdown = {
        enabled: true,
        targetDate: new Date(upcomingDropDates[0]).toISOString().slice(0, 16),
        label: "Nächster Drop in",
      };
    }
  }

  const sortedProducts = [...visibleProducts].sort((a, b) => {
    const aFirst = a.slug === "basic-bellator-shirt";
    const bFirst = b.slug === "basic-bellator-shirt";
    if (aFirst && !bFirst) return -1;
    if (bFirst && !aFirst) return 1;
    return a.id - b.id;
  });

  // Alle Kollektionen für den Filter-Reiter
  const collections = Array.from(new Set(sortedProducts.map(p => p.collection).filter(Boolean)));

  const productsWithExtras = sortedProducts.map(p => ({
    ...p,
    variants: allVariants.filter(v => v.productId === p.id),
    colors: allColors.filter(c => c.productId === p.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    isPreReleaseActive: !!p.isPreRelease && p.dropDate ? new Date(p.dropDate).getTime() > now : false,
  }));

  return (
    <main className="min-h-screen px-4 pt-4 pb-12 md:pt-6 md:pb-16">
      <CountdownBanner initialConfig={countdown} />
      <ShopFilters products={productsWithExtras} collections={collections as string[]} />
    </main>
  );
}
