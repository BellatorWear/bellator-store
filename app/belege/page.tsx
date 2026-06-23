import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import BelegeClient from "./BelegeClient";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function BelegePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userOrders = await db.select().from(orders).where(eq(orders.userId, user.id));

  // Für jede Bestellung die Positionen laden
  const ordersWithItems = await Promise.all(
    userOrders.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );

  return (
    <main className="min-h-screen text-[#e0e0e0] font-mono" style={{ backgroundImage: 'url("/background.png")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <header className="bg-black border-b border-[#333] px-6 py-4 flex justify-between items-center">
        <a href="/shop" className="text-2xl font-bold tracking-tighter italic hover:opacity-80 transition">BELLATOR.</a>
        <a href="/profil" className="text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition">← Zurück zum Profil</a>
      </header>
      <BelegeClient orders={ordersWithItems} userEmail={user.email} />
    </main>
  );
}
