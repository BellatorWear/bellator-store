import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import NewProductForm from "./NewProductForm";
import ProductRow from "./ProductRow";
import CountdownConfig from "./CountdownConfig";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/shop");

  const allProducts = await db.select().from(products);
  const allVariants = await db.select().from(productVariants);

  return (
    <main className="min-h-screen font-mono bg-black text-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Admin Panel</h1>
          <a href="/shop" className="text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition">
            ← Zurück zum Shop
          </a>
        </div>

        {/* Countdown Konfiguration */}
        <CountdownConfig />

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
