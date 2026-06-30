import { db } from "@/db";
import { products, productVariants, productColors } from "@/db/schema";
import { eq } from "drizzle-orm";
import DbProductCard from "./DbProductCard";
import CountdownBanner from "./components/CountdownBanner";
import DiscordBanner from "./components/DiscordBanner";
import { getSetting, COUNTDOWN_KEY, COUNTDOWN_DEFAULT } from "@/app/utils/settings";
import { getCurrentUser } from "@/app/actions";
import { hasPreReleaseAccess } from "@/app/cart";

export default async function ShopPage() {
  // Alle aktiven Produkte landen einheitlich im selben Grid - auch das
  // ursprünglich hardgecodete "Basic Bellator Shirt" (per Migration jetzt
  // ein ganz normales Produkt, erkannt am festen Slug
  // 'basic-bellator-shirt'). Vorher hatte das sein eigenes, separates
  // Layout über dem Grid, weshalb neu angelegte Produkte immer DARUNTER
  // statt DANEBEN erschienen.
  const [dbProducts, allVariants, allColors, countdownSetting, user] = await Promise.all([
    db.select().from(products).where(eq(products.active, true)),
    db.select().from(productVariants),
    db.select().from(productColors),
    getSetting(COUNTDOWN_KEY, COUNTDOWN_DEFAULT),
    getCurrentUser(),
  ]);
  const hasAccess = await hasPreReleaseAccess(user?.id);

  const now = Date.now();

  // Pre-Release-Produkte vor ihrem Drop-Datum nur für User mit gültigem
  // Zugangscode anzeigen - für alle anderen erst, wenn das Datum erreicht
  // ist (automatische Freigabe, kein Admin-Eingriff nötig).
  const visibleProducts = dbProducts.filter((p) => {
    if (!p.isPreRelease) return true;
    const dropPassed = p.dropDate ? new Date(p.dropDate).getTime() <= now : true;
    return dropPassed || hasAccess;
  });

  // Das ursprüngliche Drop-Shirt (per fixem Slug erkannt, nicht über eine
  // bestimmte id - die hängt davon ab, was vorher schon angelegt wurde)
  // soll weiterhin als erstes erscheinen.
  const sortedProducts = [...visibleProducts].sort((a, b) => {
    const aFirst = a.slug === "basic-bellator-shirt";
    const bFirst = b.slug === "basic-bellator-shirt";
    if (aFirst && !bFirst) return -1;
    if (bFirst && !aFirst) return 1;
    return a.id - b.id;
  });

  // Countdown: Admin-manuell eingestellter Countdown hat Vorrang. Ist
  // keiner aktiv, aber es gibt ein Produkt mit einem noch ausstehenden
  // Drop-Datum, zählt der Countdown automatisch auf den NÄCHSTEN Drop
  // runter. Gibt es gar nichts davon, verschwindet der Countdown.
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

  return (
    <main className="min-h-screen px-4 pt-4 pb-12 md:pt-6 md:pb-16">
      <CountdownBanner initialConfig={countdown} />
      <DiscordBanner />

      {/* Responsive Grid: 1 Spalte auf kleinen Handys, 2 ab ~480px, 3 ab
          Tablet, 4 ab großem Desktop - ALLE Produkte gleich behandelt. */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-[1600px] mx-auto">
        {sortedProducts.map((p) => (
          <DbProductCard
            key={p.id}
            product={p}
            variants={allVariants.filter((v) => v.productId === p.id)}
            colors={allColors.filter((c) => c.productId === p.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))}
            isPreRelease={!!p.isPreRelease && p.dropDate ? new Date(p.dropDate).getTime() > now : false}
          />
        ))}
      </div>
    </main>
  );
}
