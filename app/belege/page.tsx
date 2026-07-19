import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import BelegeClient from "./BelegeClient";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function BelegePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let ordersWithItems: Array<{
    id: number;
    total: number;
    status: string | null;
    createdAt: Date | null;
    items: Array<{ id: number; productName: string; price: number; quantity: number }>;
  }> = [];

  try {
    const userOrders = await db.select().from(orders).where(eq(orders.userId, user.id));
    ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        let items: Array<{ id: number; productName: string; price: number; quantity: number }> = [];
        try {
          items = await db.select({
            id: orderItems.id,
            productName: orderItems.productName,
            price: orderItems.price,
            quantity: orderItems.quantity,
          }).from(orderItems).where(eq(orderItems.orderId, order.id));
        } catch {}
        return {
          id: order.id,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
          items,
        };
      })
    );
  } catch (e) {
    console.error("Belege Fehler:", e);
  }

  return (
    <div className="min-h-screen bg-black font-mono site-bg">
      <main className="relative min-h-screen t-text t-invert">
      <header className="relative z-10 t-header border-b px-4 sm:px-6 py-4 flex justify-between items-center">
        <a href="/shop" className="text-xl sm:text-2xl font-black tracking-tighter italic t-text hover:opacity-70 transition">BELLATOR.</a>
        <a href="/profil" className="text-[10px] t-muted uppercase tracking-widest hover:t-text transition">← Zurück zum Profil</a>
      </header>
      <div className="relative z-10">
        <BelegeClient orders={ordersWithItems} userEmail={user.email} />
      </div>
      </main>
    </div>
  );
}
