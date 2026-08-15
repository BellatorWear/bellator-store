import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import GlobalHeader from "@/app/components/GlobalHeader";
import GlobalFooter from "@/app/components/GlobalFooter";
import { getCurrentUser } from "@/app/actions";
import { getPendingReviewProducts } from "@/app/shop/reviews";
import { isFeatureEnabled } from "@/app/utils/featureFlags";
import dynamic from "next/dynamic";

// Lazy geladen: das Popup-JS soll nur dann heruntergeladen werden, wenn
// tatsächlich offene Bewertungen anstehen (pendingReviews.length > 0),
// nicht bei jedem Besuch der Danke-Seite.
const ReviewPopup = dynamic(() => import("@/app/shop/ReviewPopup"));

export const metadata: Metadata = {
  title: "Danke für deine Bestellung",
  robots: { index: false, follow: true }, // keine Such-Landing-Page, nur für den Käufer relevant
};

// Stripe leitet nach erfolgreichem Checkout hierher weiter (success_url in
// app/cart.ts, mit {CHECKOUT_SESSION_ID}-Platzhalter). Die eigentliche
// Bestellung wird asynchron per Webhook angelegt (app/api/stripe-webhook/
// route.ts) - in aller Regel ist der Webhook schneller als die Weiterleitung
// des Nutzers, es KANN aber knapp sein. Deshalb wird hier defensiv damit
// umgegangen: existiert die Bestellung schon, zeigen wir Positionen + Summe;
// existiert sie (noch) nicht, gibt's trotzdem eine ehrliche Bestätigung
// statt eines Fehlers oder einer leeren Seite.
export default async function DankePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const user = await getCurrentUser();

  const [order] = session_id
    ? await db.select().from(orders).where(eq(orders.stripeSessionId, session_id))
    : [];
  const items = order ? await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)) : [];

  // Direkt nach dem Kauf ist der ideale Moment, um um eine Bewertung zu
  // bitten - vorher passierte das erst beim nächsten Aufruf der Shop-Liste.
  // Läuft über den Feature-Flag-Kill-Switch: bei Last kann das im Admin-
  // Panel gezielt abgeschaltet werden, ohne den Checkout selbst anzufassen.
  const reviewPopupEnabled = await isFeatureEnabled("reviewPopup");
  const pendingReviews = user && reviewPopupEnabled ? await getPendingReviewProducts() : [];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-mono site-bg">
      <div className="relative z-10 flex flex-col min-h-screen t-invert">
        <GlobalHeader />
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-8 py-16 md:py-24 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 mb-4">Bellator Streetwear</p>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter mb-6">
            Danke dir!
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-10 max-w-md mx-auto">
            {order
              ? "Deine Bestellung ist eingegangen und wird jetzt bearbeitet. Du bekommst gleich eine Bestätigung per Email."
              : "Deine Zahlung war erfolgreich. Die Bestellbestätigung trudelt in Kürze per Email ein."}
          </p>

          {order && items.length > 0 && (
            <div className="text-left border border-zinc-700 bg-black/80 p-5 sm:p-6 mb-10">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Bestellung #{order.id}</p>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-zinc-300">{item.quantity}× {item.productName}</span>
                    <span className="text-zinc-500">{((item.price * item.quantity) / 100).toFixed(2)} €</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-bold pt-3 border-t border-zinc-800">
                <span>Gesamt</span>
                <span>{(order.total / 100).toFixed(2)} €</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/shop"
              className="inline-block bg-white border-[3px] border-white px-6 py-3 text-xs font-black uppercase tracking-widest text-black hover:bg-transparent hover:text-white transition-all duration-200">
              Weiter shoppen
            </Link>
            <Link href="/profil"
              className="inline-block border-[3px] border-white px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all duration-200">
              Meine Bestellungen
            </Link>
          </div>
        </main>
        <GlobalFooter />
      </div>
      {pendingReviews.length > 0 && <ReviewPopup products={pendingReviews} />}
    </div>
  );
}
