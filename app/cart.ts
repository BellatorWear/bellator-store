"use server";
import { db } from "@/db";
import { cartItems, products, productVariants, discountCodes } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { cookies } from "next/headers";
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
  const ownerKey = await getCartOwnerKey();

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Eigener, vom Kunden eingelöster Rabattcode (siehe redeemDiscountCode)
  // hat Vorrang vor dem automatischen Stammkunden-Rabatt - beide gleichzeitig
  // anzuwenden würde sich nicht sauber abbilden lassen.
  const cookieStore = await cookies();
  const redeemedCode = cookieStore.get("bellator-discount-code")?.value;
  let appliedDiscount: { coupon: string } | { promotion_code: string } | null = null;

  if (redeemedCode) {
    const found = await db.select().from(discountCodes).where(eq(discountCodes.code, redeemedCode));
    const dc = found[0];
    const stillValid =
      dc &&
      (dc.maxRedemptions === null || (dc.timesRedeemed ?? 0) < (dc.maxRedemptions ?? 1)) &&
      (!dc.expiresAt || new Date(dc.expiresAt) > new Date());
    if (stillValid && dc.stripePromotionCodeId) {
      appliedDiscount = { promotion_code: dc.stripePromotionCodeId };
    }
  } else if (user?.discountPercent && user.discountPercent > 0) {
    // Automatischer, computerberechneter Stammkunden-Rabatt - braucht
    // keinen Code, wird live als einmaliger Coupon erzeugt.
    try {
      const coupon = await stripe.coupons.create({
        percent_off: user.discountPercent,
        duration: "once",
        name: `Stammkunden-Rabatt ${user.discountPercent}%`,
      });
      appliedDiscount = { coupon: coupon.id };
    } catch (e) {
      console.error("Stammkunden-Rabatt Coupon Fehler:", e);
    }
  }

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
            // Bilder sind jetzt echte https-URLs (Vercel Blob), nicht mehr
            // Base64 - Stripe akzeptiert nur echte URLs, das geht jetzt.
            images: item.image ? [item.image] : undefined,
            metadata: { productId: String(item.productId) },
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
      // Falls kein eigener Rabatt automatisch angewendet wird, darf der
      // Kunde trotzdem direkt bei Stripe einen Promo-Code eingeben.
      ...(appliedDiscount
        ? { discounts: [appliedDiscount] }
        : { allow_promotion_codes: true }),
      metadata: {
        ownerKey,
        userId: user?.id ? String(user.id) : "",
      },
      success_url: `${origin}/shop?checkout=success`,
      cancel_url: `${origin}/shop/warenkorb?checkout=cancelled`,
    });

    return { success: true, url: session.url };
  } catch (e) {
    console.error("Stripe Checkout Fehler:", e);
    return { error: "Checkout konnte nicht erstellt werden." };
  }
}

/**
 * Validiert einen vom Kunden eingegebenen Rabattcode gegen unsere eigene
 * discount_codes Tabelle und merkt ihn sich (Cookie) für den nächsten
 * Checkout. Die eigentliche, fälschungssichere Prüfung passiert nochmal
 * direkt bei Stripe selbst (über promotion_code), hier geht es nur um die
 * Vorschau/Bestätigung auf unserer Seite.
 */
export async function redeemDiscountCode(formData: FormData) {
  if (!(await isTrustedOrigin())) return { error: "Anfrage abgelehnt." };
  const code = ((formData.get("code") as string) ?? "").trim();
  if (!code) return { error: "Bitte einen Code eingeben." };

  const found = await db.select().from(discountCodes).where(eq(discountCodes.code, code));
  if (found.length === 0) return { error: "Ungültiger Rabattcode." };
  const dc = found[0];

  if (dc.expiresAt && new Date(dc.expiresAt) < new Date()) {
    return { error: "Dieser Code ist abgelaufen." };
  }
  if (dc.maxRedemptions !== null && (dc.timesRedeemed ?? 0) >= (dc.maxRedemptions ?? 1)) {
    return { error: "Dieser Code wurde bereits vollständig eingelöst." };
  }
  if (dc.userId) {
    const user = await getCurrentUser();
    if (!user || user.id !== dc.userId) {
      return { error: "Dieser Code ist einem anderen Account zugeordnet." };
    }
  }

  const cookieStore = await cookies();
  cookieStore.set("bellator-discount-code", code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return { success: true, percentOff: dc.percentOff };
}
