import { db } from "@/db";
import { discountCodes } from "@/db/schema";
import crypto from "crypto";

// Dieselbe Zeichenmenge wie für Access Keys: Buchstaben + Zahlen +
// Sonderzeichen, 10 Stellen, kryptographisch zufällig.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";

export function generateRandomCode(length = 10): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return out;
}

/**
 * Erstellt über die Stripe API einen echten, nur einmal nutzbaren
 * Rabattcode (Coupon + Promotion Code) für genau den angegebenen
 * Prozentsatz - z.B. wenn ein User eine Punkte-Prämie einlöst. Der Code
 * wird zusätzlich lokal in discount_codes gespeichert, damit wir eine
 * eigene Übersicht/Historie haben.
 *
 * Gibt bei fehlendem STRIPE_SECRET_KEY einen klaren Fehler zurück statt
 * abzustürzen (z.B. wenn das noch nicht eingerichtet ist).
 */
export async function createSingleUseStripeCode(opts: {
  percentOff: number;
  source: string;
  userId?: number | null;
  expiresInDays?: number;
}): Promise<{ code: string } | { error: string }> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: "Stripe ist nicht konfiguriert (STRIPE_SECRET_KEY fehlt)." };
  }
  if (opts.percentOff <= 0 || opts.percentOff > 100) {
    return { error: "Ungültiger Rabatt-Prozentsatz." };
  }

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Bis zu 5 Versuche, falls der zufällige Code (extrem unwahrscheinlich)
  // schon als Stripe Promotion Code existiert.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRandomCode(10);
    try {
      const coupon = await stripe.coupons.create({
        percent_off: opts.percentOff,
        duration: "once",
        max_redemptions: 1,
        name: `Bellator ${opts.source} ${opts.percentOff}%`,
      });

      const expiresAt = opts.expiresInDays
        ? Math.floor(Date.now() / 1000) + opts.expiresInDays * 24 * 60 * 60
        : undefined;

      const promo = await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon: coupon.id },
        code,
        max_redemptions: 1,
        ...(expiresAt ? { expires_at: expiresAt } : {}),
      });

      await db.insert(discountCodes).values({
        code,
        percentOff: opts.percentOff,
        source: opts.source,
        userId: opts.userId ?? null,
        stripeCouponId: coupon.id,
        stripePromotionCodeId: promo.id,
        maxRedemptions: 1,
        expiresAt: opts.expiresInDays ? new Date(Date.now() + opts.expiresInDays * 24 * 60 * 60 * 1000) : null,
      });

      return { code };
    } catch (e: unknown) {
      // Code schon vergeben -> nochmal mit neuem Zufallscode versuchen.
      const message = e instanceof Error ? e.message : String(e);
      if (!message.toLowerCase().includes("already") && attempt === 4) {
        console.error("Stripe Rabattcode Fehler:", e);
        return { error: "Rabattcode konnte nicht erstellt werden." };
      }
    }
  }
  return { error: "Rabattcode konnte nicht erstellt werden (zu viele Versuche)." };
}
