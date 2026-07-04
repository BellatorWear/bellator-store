import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, productVariants, users, cartItems, pointTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { awardChallengeByType } from "@/app/actions";

// Verarbeitet abgeschlossene Stripe-Checkouts:
// - legt die Bestellung + Positionen in der DB an (vorher passierte das NIE,
//   weil es gar keinen Webhook gab - "orders"/"order_items" blieben leer)
// - leert den Warenkorb des Käufers
// - erhöht soldCount je Produkt (für Drop-Limits) und reduziert den
//   Lagerbestand der gekauften Größe (falls eine gewählt wurde)
// - berechnet einen automatischen Stammkunden-Rabatt
// - vergibt die Challenges "Erster Kauf" / "Treuer Kunde"
//
// Benötigt STRIPE_WEBHOOK_SECRET (aus dem Stripe Dashboard -> Webhooks ->
// Endpoint anlegen -> Signing Secret). Ohne korrekte Signatur wird der
// Request abgelehnt, damit niemand gefälschte "Bestellung bezahlt"-Events
// schicken kann.
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe Webhook: STRIPE_SECRET_KEY oder STRIPE_WEBHOOK_SECRET fehlt.");
    return NextResponse.json({ error: "Nicht konfiguriert." }, { status: 500 });
  }

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Keine Signatur." }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Stripe Webhook Signatur ungültig:", e);
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as import("stripe").Stripe.Checkout.Session;

  try {
    // Idempotenz: Stripe kann denselben Event mehrfach senden (Retries).
    const existing = await db.select().from(orders).where(eq(orders.stripeSessionId, session.id));
    if (existing.length > 0) {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    const ownerKey = (session.metadata?.ownerKey as string) ?? "";
    const userIdMeta = session.metadata?.userId ? Number(session.metadata.userId) : null;

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ["data.price.product"],
      limit: 100,
    });

    const total = session.amount_total ?? 0;
    const discountTotal = session.total_details?.amount_discount ?? 0;
    const discountPercentApplied = total + discountTotal > 0
      ? Math.round((discountTotal / (total + discountTotal)) * 100)
      : 0;

    const [order] = await db
      .insert(orders)
      .values({
        userId: userIdMeta,
        guestEmail: userIdMeta ? null : (session.customer_email ?? null),
        total,
        discountApplied: discountPercentApplied,
        status: "paid",
        stripeSessionId: session.id,
      })
      .returning({ id: orders.id });

    // Bestellpositionen anlegen + soldCount je Produkt erhöhen
    for (const li of lineItems.data) {
      const name = li.description ?? "Produkt";
      const qty = li.quantity ?? 1;
      const price = li.amount_total ?? 0;

      let productId: number | null = null;
      let variantId: number | null = null;
      const stripeProduct = li.price?.product;
      if (stripeProduct && typeof stripeProduct === "object" && "metadata" in stripeProduct) {
        const meta = (stripeProduct as { metadata?: Record<string, string> }).metadata;
        if (meta?.productId) productId = Number(meta.productId) || null;
        if (meta?.variantId) variantId = Number(meta.variantId) || null;
      }

      await db.insert(orderItems).values({
        orderId: order.id,
        productId,
        productName: name,
        price,
        quantity: qty,
      });

      if (productId) {
        const prod = await db.select().from(products).where(eq(products.id, productId));
        if (prod.length > 0) {
          await db
            .update(products)
            .set({ soldCount: (prod[0].soldCount ?? 0) + qty })
            .where(eq(products.id, productId));
        }
      }

      if (variantId) {
        const variantRows = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
        const variant = variantRows[0];
        // null = unlimitiert, also nichts abzuziehen.
        if (variant && variant.stock !== null) {
          await db
            .update(productVariants)
            .set({ stock: Math.max(0, variant.stock - qty) })
            .where(eq(productVariants.id, variantId));
        }
      }
    }

    // Cart über den ownerKey leeren (der Checkout-Käufer, egal ob User oder Gast)
    if (ownerKey) {
      await db.delete(cartItems).where(eq(cartItems.ownerKey, ownerKey));
    }

    // Eingeloggter User: orderCount hochzählen, Stammkunden-Rabatt
    // berechnen, Challenges vergeben.
    if (userIdMeta) {
      const userResult = await db.select().from(users).where(eq(users.id, userIdMeta));
      if (userResult.length > 0) {
        const user = userResult[0];
        const newOrderCount = (user.orderCount ?? 0) + 1;
        // Computerberechneter Treuerabatt: +5% je Bestellung nach der ersten,
        // gedeckelt bei 25%, damit es nicht unkontrolliert wächst.
        const newDiscount = Math.min(5 * Math.max(0, newOrderCount - 1), 25);
        // Punkte: 10 Punkte pro Euro (total, NICHT rabattierter Betrag).
        // total ist in Cent, also: Punkte = total / 10
        const pointsEarned = Math.floor(total / 10);
        const newPoints = (user.points ?? 0) + pointsEarned;

        await db
          .update(users)
          .set({ orderCount: newOrderCount, discountPercent: newDiscount, points: newPoints })
          .where(eq(users.id, userIdMeta));

        if (pointsEarned > 0) {
          await db.insert(pointTransactions).values({
            userId: userIdMeta,
            points: pointsEarned,
            reason: `Bestellung #${order.id} — ${(total / 100).toFixed(2)}€`,
          });
        }

        if (newOrderCount === 1) {
          await awardChallengeByType(userIdMeta, "first_order");
        }
        if (newOrderCount === 3) {
          await awardChallengeByType(userIdMeta, "repeat_customer");
        }
        if (newOrderCount === 5) {
          await awardChallengeByType(userIdMeta, "order_5");
        }
        if (newOrderCount === 10) {
          await awardChallengeByType(userIdMeta, "order_10");
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Stripe Webhook Verarbeitungsfehler:", e);
    // 500 zurückgeben, damit Stripe es automatisch erneut versucht.
    return NextResponse.json({ error: "Verarbeitungsfehler." }, { status: 500 });
  }
}
