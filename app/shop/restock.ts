"use server";

import { db } from "@/db";
import { restockNotifications, products, productVariants } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/app/actions";
import { checkEmailRateLimit } from "@/app/utils/ratelimit";
import { sendEmail } from "@/app/utils/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * User trägt sich für eine Restock-Benachrichtigung ein (Newsletter-artige
 * Einzel-Email, kein voller Newsletter-Opt-in). Eingeloggte User können die
 * Email weglassen (dann wird ihre Account-Email genutzt), Gäste müssen eine
 * angeben.
 */
export async function subscribeRestock(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const productId = Number(formData.get("productId"));
  const variantId = formData.get("variantId") ? Number(formData.get("variantId")) : null;
  if (!productId) return { error: "Ungültiges Produkt." };

  const user = await getCurrentUser();
  const rawEmail = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const email = rawEmail || user?.email || "";

  if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
    return { error: "Bitte eine gültige E-Mail-Adresse angeben." };
  }

  const rateLimit = await checkEmailRateLimit(email);
  if (!rateLimit.success) {
    return { error: "Zu viele Anfragen für diese E-Mail. Bitte später erneut versuchen." };
  }

  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product) return { error: "Produkt nicht gefunden." };

  // Nur sinnvoll, wenn tatsächlich ausverkauft - verhindert Spam-Eintragungen
  // für ganz normal verfügbare Produkte.
  if (variantId) {
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
    if (!variant || variant.stock === null || variant.stock > 0) {
      return { error: "Diese Variante ist verfügbar." };
    }
  } else if (product.dropLimit === null || (product.soldCount ?? 0) < product.dropLimit) {
    return { error: "Dieses Produkt ist verfügbar." };
  }

  // Nicht doppelt eintragen, falls schon eine offene (nicht benachrichtigte)
  // Anmeldung für dieselbe Kombination existiert.
  const existing = await db
    .select()
    .from(restockNotifications)
    .where(
      and(
        eq(restockNotifications.productId, productId),
        variantId ? eq(restockNotifications.variantId, variantId) : isNull(restockNotifications.variantId),
        eq(restockNotifications.email, email),
        isNull(restockNotifications.notifiedAt),
      ),
    );
  if (existing.length > 0) return { success: true };

  await db.insert(restockNotifications).values({
    productId,
    variantId,
    email,
    userId: user?.id ?? null,
  });

  return { success: true };
}

/**
 * Wird von der Admin-Restock-Aktion aufgerufen, wenn ein Produkt/eine
 * Variante von "ausverkauft" zu "wieder verfügbar" wechselt. Verschickt
 * eine Sammel-Email an alle offenen Anmeldungen und markiert sie als
 * benachrichtigt.
 */
export async function notifyRestockSubscribers(productId: number, variantId: number | null): Promise<void> {
  const subscribers = await db
    .select()
    .from(restockNotifications)
    .where(
      and(
        eq(restockNotifications.productId, productId),
        variantId ? eq(restockNotifications.variantId, variantId) : isNull(restockNotifications.variantId),
        isNull(restockNotifications.notifiedAt),
      ),
    );
  if (subscribers.length === 0) return;

  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mz-dev.de";
  const productUrl = `${siteUrl}/shop/produkt/${product.slug}`;

  await sendEmail({
    to: subscribers.map((s) => s.email),
    subject: `Wieder da: ${product.name}`,
    source: "restock_notification",
    html: `
      <p>Gute Nachrichten - <strong>${product.name}</strong> ist wieder verfügbar.</p>
      <p><a href="${productUrl}">Jetzt ansehen</a></p>
      <p style="color:#888;font-size:12px;">Du bekommst diese Mail, weil du dich für eine Restock-Benachrichtigung eingetragen hast.</p>
    `,
  });

  await db
    .update(restockNotifications)
    .set({ notifiedAt: new Date() })
    .where(
      and(
        eq(restockNotifications.productId, productId),
        variantId ? eq(restockNotifications.variantId, variantId) : isNull(restockNotifications.variantId),
        isNull(restockNotifications.notifiedAt),
      ),
    );
}
