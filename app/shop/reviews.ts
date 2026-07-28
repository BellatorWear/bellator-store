"use server";

import { db } from "@/db";
import { orders, orderItems, products, productReviews, users } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getCurrentUser, awardChallengeByType } from "@/app/actions";
import { sanitizeText } from "@/app/utils/inputSafety";
import { checkGeneralRateLimit } from "@/app/utils/ratelimit";
import { isTrustedOrigin } from "@/app/utils/origin";
import { revalidatePath } from "next/cache";

export type PendingReviewProduct = {
  orderId: number;
  productId: number;
  productName: string;
  productImage: string | null;
};

/**
 * Produkte aus der letzten Bestellung des Users, die noch keine Review
 * haben - Grundlage für das Popup direkt nach dem Checkout.
 */
export async function getPendingReviewProducts(): Promise<PendingReviewProduct[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const [lastOrder] = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt))
    .limit(1);
  if (!lastOrder) return [];

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, lastOrder.id));
  if (items.length === 0) return [];

  const productIds = [...new Set(items.map((i) => i.productId).filter((id): id is number => id !== null))];
  if (productIds.length === 0) return [];

  const [productRows, existingReviews] = await Promise.all([
    db.select().from(products).where(inArray(products.id, productIds)),
    db.select().from(productReviews).where(and(eq(productReviews.userId, user.id), inArray(productReviews.productId, productIds))),
  ]);
  const reviewedIds = new Set(existingReviews.map((r) => r.productId));

  return items
    .filter((i) => i.productId !== null && !reviewedIds.has(i.productId))
    .map((i) => {
      const product = productRows.find((p) => p.id === i.productId);
      return {
        orderId: lastOrder.id,
        productId: i.productId!,
        productName: i.productName,
        productImage: product?.images?.[0] ?? null,
      };
    })
    // Pro Produkt nur einmal, falls mehrfach in derselben Bestellung.
    .filter((item, idx, arr) => arr.findIndex((x) => x.productId === item.productId) === idx);
}

export type FeaturedReview = {
  id: number;
  rating: number;
  title: string;
  body: string;
  productName: string;
  productSlug: string;
  username: string | null;
  createdAt: Date | null;
};

/**
 * Reviews für die Startseiten-Banner - beste zuerst, dann neueste.
 * Bewusst kein Bezug zum eingeloggten User (öffentliche Anzeige für
 * alle Besucher).
 */
export async function getFeaturedReviews(limit = 20): Promise<FeaturedReview[]> {
  const rows = await db
    .select({
      id: productReviews.id,
      rating: productReviews.rating,
      title: productReviews.title,
      body: productReviews.body,
      createdAt: productReviews.createdAt,
      productName: products.name,
      productSlug: products.slug,
      username: users.username,
    })
    .from(productReviews)
    .innerJoin(products, eq(productReviews.productId, products.id))
    .leftJoin(users, eq(productReviews.userId, users.id))
    .orderBy(desc(productReviews.rating), desc(productReviews.createdAt))
    .limit(limit);

  return rows;
}

export async function submitProductReview(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  if (!(await isTrustedOrigin())) return { error: "Anfrage abgelehnt." };
  const user = await getCurrentUser();
  if (!user) return { error: "Bitte einloggen." };

  const rateLimit = await checkGeneralRateLimit();
  if (!rateLimit.success) return { error: "Zu viele Anfragen - kurz warten." };

  const productId = Number(formData.get("productId"));
  const orderId = Number(formData.get("orderId"));
  const rating = Number(formData.get("rating"));
  const titleRaw = ((formData.get("title") as string) ?? "").trim();
  const bodyRaw = ((formData.get("body") as string) ?? "").trim();

  if (!productId || !orderId) return { error: "Ungültige Anfrage." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Bitte 1-5 Sterne vergeben." };
  if (!titleRaw) return { error: "Bitte einen Titel angeben." };
  if (!bodyRaw) return { error: "Bitte eine Beschreibung angeben." };

  // Serverseitig nachprüfen, dass diese Bestellung wirklich dem User
  // gehört und das Produkt tatsächlich enthält - der Client könnte
  // sonst einfach irgendeine orderId/productId-Kombination schicken.
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order || order.userId !== user.id) return { error: "Bestellung nicht gefunden." };

  const [item] = await db
    .select()
    .from(orderItems)
    .where(and(eq(orderItems.orderId, orderId), eq(orderItems.productId, productId)));
  if (!item) return { error: "Dieses Produkt ist nicht Teil dieser Bestellung." };

  const title = sanitizeText(titleRaw, 100);
  const body = sanitizeText(bodyRaw, 2000);

  try {
    await db.insert(productReviews).values({ productId, userId: user.id, orderId, rating, title, body });
  } catch (e) {
    // Unique-Constraint (user_id, product_id) - schon eine Review für
    // dieses Produkt vorhanden.
    return { error: "Du hast dieses Produkt bereits bewertet." };
  }

  // Echtes, serverseitig verifiziertes Ereignis (Review zu einem
  // nachgewiesenen Kauf) - genau wie first_order/theme_explorer/etc.
  // wird die Challenge direkt hier ausgelöst, nicht per Selbstauskunft.
  await awardChallengeByType(user.id, "review");

  revalidatePath(`/shop/produkt`);
  return { success: true };
}
