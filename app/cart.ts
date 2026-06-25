"use server";
import { db } from "@/db";
import { cartItems, products, productVariants } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { getCartOwnerKey, initCartCookie } from "./utils/cartOwner";
import { getCurrentUser } from "./actions";
import { isTrustedOrigin } from "./utils/origin";

const CART_MAX_AGE_HOURS = 24;

/** Liest den Warenkorb und löscht ihn automatisch, wenn er älter als 24h ist. */
export async function getCart() {
  const ownerKey = await getCartOwnerKey();

  const cutoff = new Date(Date.now() - CART_MAX_AGE_HOURS * 60 * 60 * 1000);
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.ownerKey, ownerKey), lt(cartItems.addedAt, cutoff)));

  const rows = await db
    .select({
      item: cartItems,
      product: products,
      variant: productVariants,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .where(eq(cartItems.ownerKey, ownerKey));

  return rows.map((r) => {
    const unitPrice = r.variant?.priceCentsOverride ?? r.product.priceCents;
    return {
      id: r.item.id,
      productId: r.product.id,
      variantId: r.variant?.id ?? null,
      name: r.product.name,
      variantLabel: r.variant?.label ?? null,
      dropLabel: r.product.dropLabel ?? null,
      image: r.product.images?.[0] ?? null,
      unitPriceCents: unitPrice,
      quantity: r.item.quantity ?? 1,
    };
  });
}

export async function addToCart(formData: FormData) {
  if (!(await isTrustedOrigin())) return { error: "Anfrage abgelehnt." };
  const productId = Number(formData.get("productId"));
  const variantId = formData.get("variantId") ? Number(formData.get("variantId")) : null;
  const quantity = Math.max(1, Math.min(10, Number(formData.get("quantity")) || 1));
  if (!productId) return { error: "Ungültiges Produkt." };

  const ownerKey = await initCartCookie();

  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.ownerKey, ownerKey), eq(cartItems.productId, productId)));

  const match = existing.find((e) => e.variantId === variantId);
  if (match) {
    await db
      .update(cartItems)
      .set({ quantity: (match.quantity ?? 1) + quantity, addedAt: new Date() })
      .where(eq(cartItems.id, match.id));
  } else {
    await db.insert(cartItems).values({ ownerKey, productId, variantId, quantity });
  }

  return { success: true };
}

export async function removeFromCart(formData: FormData) {
  if (!(await isTrustedOrigin())) return { error: "Anfrage abgelehnt." };
  const itemId = Number(formData.get("itemId"));
  const ownerKey = await getCartOwnerKey();
  await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.ownerKey, ownerKey)));
  return { success: true };
}

export async function updateCartQuantity(formData: FormData) {
  if (!(await isTrustedOrigin())) return { error: "Anfrage abgelehnt." };
  const itemId = Number(formData.get("itemId"));
  const quantity = Math.max(1, Math.min(10, Number(formData.get("quantity")) || 1));
  const ownerKey = await getCartOwnerKey();
  await db
    .update(cartItems)
    .set({ quantity })
    .where(and(eq(cartItems.id, itemId), eq(cartItems.ownerKey, ownerKey)));
  return { success: true };
}

/**
 * Erstellt eine echte Stripe Checkout Session direkt aus unseren eigenen
 * Produktdaten (price_data inline) - es muss dafür NICHTS vorher manuell
 * im Stripe-Dashboard angelegt werden. Erfordert STRIPE_SECRET_KEY in der
 * Umgebung, sonst kommt eine klare Fehlermeldung statt eines Absturzes.
 */
export async function createCheckoutSession() {
  if (!(await isTrustedOrigin())) return { error: "Anfrage abgelehnt." };
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      error:
        "Stripe ist noch nicht eingerichtet (STRIPE_SECRET_KEY fehlt). Bitte den Secret Key von deinem Co-Dev besorgen und in die Umgebungsvariablen eintragen.",
    };
  }

  const cart = await getCart();
  if (cart.length === 0) return { error: "Warenkorb ist leer." };

  const user = await getCurrentUser();

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: cart.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: item.unitPriceCents,
          product_data: {
            name: item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name,
            // Hinweis: Stripe akzeptiert hier nur echte https-URLs, keine
            // Base64-Data-URLs (so speichern wir unsere Produktbilder).
            // Bilder werden deshalb bewusst nicht mitgeschickt.
          },
        },
      })),
      // Versandadresse wird bei Stripe abgefragt, Versandkosten werden dort
      // berechnet/angezeigt (nicht vorher im Warenkorb).
      shipping_address_collection: { allowed_countries: ["DE", "AT", "CH"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 490, currency: "eur" },
            display_name: "Standardversand",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 5 },
            },
          },
        },
      ],
      customer_email: user?.email,
      success_url: `${origin}/shop?checkout=success`,
      cancel_url: `${origin}/shop/warenkorb?checkout=cancelled`,
    });

    return { success: true, url: session.url };
  } catch (e) {
    console.error("Stripe Checkout Fehler:", e);
    return { error: "Checkout konnte nicht erstellt werden." };
  }
}
