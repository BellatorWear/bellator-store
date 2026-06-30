import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { db } from "@/db";
import { products, productVariants, productColors, users, newsPosts, preReleaseCodes, preReleaseRedemptions } from "@/db/schema";
import { desc } from "drizzle-orm";
import NewProductForm from "./NewProductForm";
import ProductRow from "./ProductRow";
import CountdownConfig from "./CountdownConfig";
import ExclusiveCodeConfig from "./ExclusiveCodeConfig";
import NewsChannel from "./NewsChannel";
import UserSearch from "./UserSearch";
import BlobStatus from "./BlobStatus";
import PreReleaseCodeManager from "./PreReleaseCodeManager";
import AdminDashboard, { type AdminFunctionGroup } from "./AdminDashboard";
import { getSetting, COUNTDOWN_KEY, COUNTDOWN_DEFAULT, EXCLUSIVE_CODE_KEY, EXCLUSIVE_CODE_DEFAULT } from "@/app/utils/settings";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/shop");

  const [allProducts, allVariants, allColors, userCountResult, countdown, exclusiveCode, recentPosts, allPreReleaseCodes, allPreReleaseRedemptions] = await Promise.all([
    db.select().from(products),
    db.select().from(productVariants),
    db.select().from(productColors),
    db.select().from(users),
    getSetting(COUNTDOWN_KEY, COUNTDOWN_DEFAULT),
    getSetting(EXCLUSIVE_CODE_KEY, EXCLUSIVE_CODE_DEFAULT),
    db.select().from(newsPosts).orderBy(desc(newsPosts.createdAt)).limit(5),
    db.select().from(preReleaseCodes),
    db.select().from(preReleaseRedemptions),
  ]);
  const userCount = userCountResult.length;
  const preReleaseCodesWithCounts = allPreReleaseCodes.map((c) => ({
    ...c,
    redemptionCount: allPreReleaseRedemptions.filter((r) => r.codeId === c.id).length,
  }));

  const groups: AdminFunctionGroup[] = [
    {
      title: "Produkte",
      items: [
        {
          id: "new-product",
          title: "Neues Produkt anlegen",
          description: "Name, Preis, Rabatt, Bilder, Drop-Limit",
          keywords: ["produkt", "anlegen", "neu", "rabatt", "bild", "upload", "drop"],
          content: <NewProductForm />,
        },
        {
          id: "blob-status",
          title: "Bilder-Upload testen",
          description: "Prüft die Verbindung zu Vercel Blob",
          keywords: ["bild", "upload", "blob", "fehler", "vercel", "foto"],
          content: <BlobStatus />,
        },
        {
          id: "existing-products",
          title: "Bestehende Produkte verwalten",
          description: `${allProducts.length} Produkt${allProducts.length === 1 ? "" : "e"} - bearbeiten, löschen, Varianten`,
          keywords: ["produkt", "bearbeiten", "löschen", "variante", "lager", "verwalten"],
          content: (
            <div className="space-y-4">
              {allProducts.length === 0 && (
                <p className="text-xs text-zinc-600 uppercase tracking-widest border border-zinc-800 p-4">Noch keine Produkte angelegt.</p>
              )}
              {allProducts.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  variants={allVariants.filter((v) => v.productId === p.id)}
                  colors={allColors.filter((c) => c.productId === p.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))}
                />
              ))}
            </div>
          ),
        },
      ],
    },
    {
      title: "User-Verwaltung",
      items: [
        {
          id: "user-search",
          title: "User-Suche",
          description: "Per Email oder Benutzername (auch alte Namen) finden",
          keywords: ["user", "suche", "email", "username", "benutzername", "profil", "historie"],
          content: <UserSearch />,
        },
      ],
    },
    {
      title: "Marketing & Engagement",
      items: [
        {
          id: "news-channel",
          title: "News-Channel",
          description: "Post veröffentlichen - geht an Push + Newsletter raus",
          keywords: ["news", "push", "newsletter", "mail", "ankündigung", "post"],
          content: <NewsChannel recentPosts={recentPosts} />,
        },
        {
          id: "exclusive-codes",
          title: "Exklusive Erstbesteller-Rabattcodes",
          description: "Code für die ersten N Bestellungen konfigurieren",
          keywords: ["rabatt", "code", "exklusiv", "discount", "gutschein", "stripe"],
          content: <ExclusiveCodeConfig initial={exclusiveCode} />,
        },
        {
          id: "prerelease-codes",
          title: "Pre-Release-Zugangscodes",
          description: "Schaltet Pre-Release-Produkte vor dem Drop-Datum frei",
          keywords: ["pre-release", "prerelease", "zugang", "code", "vip", "early access", "drop"],
          content: <PreReleaseCodeManager codes={preReleaseCodesWithCounts} />,
        },
      ],
    },
    {
      title: "Shop-Einstellungen",
      items: [
        {
          id: "countdown",
          title: "Countdown",
          description: "Zieldatum & Label für den Drop-Countdown",
          keywords: ["countdown", "zeit", "drop", "timer"],
          content: <CountdownConfig initial={countdown} />,
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen font-mono bg-black text-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest border border-zinc-700 px-3 py-1.5 text-zinc-300">
              <span className="text-yellow-400 font-bold">{userCount}</span> registrierte User
            </span>
            <a href="/shop" className="text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition">
              ← Zurück zum Shop
            </a>
          </div>
        </div>

        <AdminDashboard groups={groups} />
      </div>
    </main>
  );
}
