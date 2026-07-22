"use server";

import { db } from "@/db";
import {
  users, orders, orderItems, pointTransactions, userChallenges, challenges,
  newsletter, userRewards, rewards, usernameHistory, cartItems,
  preReleaseRedemptions, supportTickets, supportTicketMessages, chatMessages,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/app/actions";
import { checkGeneralRateLimit } from "@/app/utils/ratelimit";

/**
 * DSGVO Art. 15/20 Datenexport - sammelt alle personenbezogenen Daten, die
 * über den eingeloggten User in der DB gespeichert sind, und gibt sie als
 * ein JSON-Objekt zurück. Kein Datei-Storage nötig - der Client baut daraus
 * clientseitig einen Download (siehe GdprExportButton.tsx).
 *
 * Absichtlich NICHT enthalten: passwordHash, pushSubscription (technische
 * Zugangs-/Gerätedaten, kein "Auskunftsrecht"-Inhalt im engeren Sinn, und
 * ein Leak des Rohwerts wäre unnötig riskant), interne IDs anderer User
 * (z.B. wer ein Ticket sonst noch beantwortet hat - das wären fremde
 * personenbezogene Daten).
 */
export async function exportUserData() {
  const user = await getCurrentUser();
  if (!user) return { error: "Bitte einloggen." };

  const rateLimit = await checkGeneralRateLimit();
  if (!rateLimit.success) return { error: "Zu viele Anfragen - bitte kurz warten." };

  const userId = user.id;

  const [
    userRow,
    userOrders,
    userPointTx,
    completedChallenges,
    newsletterEntry,
    redeemedRewards,
    nameHistory,
    currentCart,
    preReleaseUses,
    myTickets,
    myTicketMessages,
    myChatMessages,
  ] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)),
    db.select().from(orders).where(eq(orders.userId, userId)),
    db.select().from(pointTransactions).where(eq(pointTransactions.userId, userId)),
    db
      .select({ title: challenges.title, description: challenges.description, pointReward: challenges.pointReward, completedAt: userChallenges.completedAt })
      .from(userChallenges)
      .innerJoin(challenges, eq(userChallenges.challengeId, challenges.id))
      .where(eq(userChallenges.userId, userId)),
    db.select().from(newsletter).where(eq(newsletter.email, user.email)),
    db
      .select({ title: rewards.title, costPoints: rewards.costPoints, code: userRewards.code, redeemedAt: userRewards.redeemedAt })
      .from(userRewards)
      .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
      .where(eq(userRewards.userId, userId)),
    db.select().from(usernameHistory).where(eq(usernameHistory.userId, userId)),
    db.select().from(cartItems).where(eq(cartItems.ownerKey, `user:${userId}`)),
    db.select().from(preReleaseRedemptions).where(eq(preReleaseRedemptions.userId, userId)),
    db.select().from(supportTickets).where(eq(supportTickets.userId, userId)),
    db.select().from(supportTicketMessages).where(eq(supportTicketMessages.userId, userId)),
    db.select().from(chatMessages).where(eq(chatMessages.userId, userId)),
  ]);

  const orderIds = userOrders.map((o) => o.id);
  const items = orderIds.length > 0
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
    : [];

  const account = userRow[0];

  return {
    success: true,
    exportedAt: new Date().toISOString(),
    data: {
      account: account
        ? {
            id: account.id,
            memberNo: account.memberNo,
            email: account.email,
            username: account.username,
            emailVerified: account.emailVerified,
            createdAt: account.createdAt,
            points: account.points,
            theme: account.theme,
            orderCount: account.orderCount,
            discountPercent: account.discountPercent,
            pushEnabled: account.pushEnabled,
            newsletterOptIn: account.newsletterOptIn,
            usernameChangedAt: account.usernameChangedAt,
            role: account.role,
            isTeam: account.isTeam,
          }
        : null,
      usernameHistory: nameHistory.map((h) => ({ username: h.username, changedAt: h.changedAt })),
      orders: userOrders.map((o) => ({
        id: o.id,
        total: o.total,
        discountApplied: o.discountApplied,
        status: o.status,
        createdAt: o.createdAt,
        items: items
          .filter((i) => i.orderId === o.id)
          .map((i) => ({ productName: i.productName, price: i.price, quantity: i.quantity })),
      })),
      currentCart: currentCart.map((c) => ({
        productId: c.productId,
        variantId: c.variantId,
        colorId: c.colorId,
        quantity: c.quantity,
        addedAt: c.addedAt,
      })),
      pointTransactions: userPointTx.map((p) => ({ points: p.points, reason: p.reason, createdAt: p.createdAt })),
      completedChallenges,
      redeemedRewards,
      newsletterSubscription: newsletterEntry[0]
        ? { active: newsletterEntry[0].active, subscribedAt: newsletterEntry[0].subscribedAt }
        : null,
      preReleaseCodeRedemptions: preReleaseUses.map((r) => ({ codeId: r.codeId, redeemedAt: r.redeemedAt })),
      supportTickets: myTickets.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
      })),
      supportTicketMessagesAuthoredByMe: myTicketMessages.map((m) => ({
        ticketId: m.ticketId,
        body: m.body,
        createdAt: m.createdAt,
      })),
      teamChatMessagesAuthoredByMe: myChatMessages.map((m) => ({
        channelId: m.channelId,
        body: m.body,
        createdAt: m.createdAt,
        editedAt: m.editedAt,
      })),
    },
  };
}
