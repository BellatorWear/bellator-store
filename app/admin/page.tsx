import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { db } from "@/db";
import { products, productVariants, users, newsPosts } from "@/db/schema";
import { desc } from "drizzle-orm";
import NewProductForm from "./NewProductForm";
import ProductRow from "./ProductRow";
import CountdownConfig from "./CountdownConfig";
import ExclusiveCodeConfig from "./ExclusiveCodeConfig";
import NewsChannel from "./NewsChannel";
import UserSearch from "./UserSearch";
import { getSetting, COUNTDOWN_KEY, COUNTDOWN_DEFAULT, EXCLUSIVE_CODE_KEY, EXCLUSIVE_CODE_DEFAULT } from "@/app/utils/settings";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/shop");

  const [allProducts, allVariants, userCountResult, countdown, exclusiveCode, recentPosts] = await Promise.all([
    db.select().from(products),
    db.select().from(productVariants),
    db.select().from(users),
    getSetting(COUNTDOWN_KEY, COUNTDOWN_DEFAULT),
    getSetting(EXCLUSIVE_CODE_KEY, EXCLUSIVE_CODE_DEFAULT),
    db.select().from(newsPosts).orderBy(desc(newsPosts.createdAt)).limit(5),
  ]);
  const userCount = userCountResult.length;

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

        {/* Countdown Konfiguration */}
        <CountdownConfig initial={countdown} />

        {/* Exklusive Erstbesteller-Rabattcodes */}
        <ExclusiveCodeConfig initial={exclusiveCode} />

        {/* News-Channel */}
        <NewsChannel recentPosts={recentPosts} />

        {/* User-Suche per (altem oder neuem) Username */}
        <UserSearch />

        {/* Neues Produkt */}
        <NewProductForm />

        {/* Bestehende Produkte */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Bestehende Produkte</h2>
          {allProducts.length === 0 && (
            <p className="text-xs text-zinc-600 uppercase tracking-widest border border-zinc-800 p-4">Noch keine Produkte angelegt.</p>
          )}
          {allProducts.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              variants={allVariants.filter((v) => v.productId === p.id)}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
