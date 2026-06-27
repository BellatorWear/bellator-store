import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

type PushPayload = { title: string; body: string; url?: string };

function getWebPush() {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const webpush = require("web-push");
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:info@mz-dev.de",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  return webpush;
}

export async function sendPushToUser(userId: number, payload: PushPayload) {
  const webpush = getWebPush();
  if (!webpush) return { error: "Push ist nicht konfiguriert (VAPID Keys fehlen)." };

  const result = await db.select().from(users).where(eq(users.id, userId));
  const user = result[0];
  if (!user?.pushSubscription) return { error: "Keine Subscription vorhanden." };

  try {
    const subscription = JSON.parse(user.pushSubscription);
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (e: unknown) {
    const statusCode = (e as { statusCode?: number })?.statusCode;
    // 404/410 = Subscription ist nicht mehr gültig (z.B. Browser-Daten gelöscht) -> aufräumen.
    if (statusCode === 404 || statusCode === 410) {
      await db.update(users).set({ pushSubscription: null, pushEnabled: false }).where(eq(users.id, userId));
    }
    console.error("Push an User", userId, "fehlgeschlagen:", e);
    return { error: "Senden fehlgeschlagen." };
  }
}

/**
 * Schickt eine Push-Nachricht an ALLE User mit aktiver Subscription (z.B.
 * für einen News-Channel Post). Läuft sequentiell mit kleinen Pausen wäre
 * für sehr viele User besser, für eine Bellator-Shopgröße reicht parallel.
 */
export async function sendPushToAll(payload: PushPayload) {
  const webpush = getWebPush();
  if (!webpush) return { error: "Push ist nicht konfiguriert (VAPID Keys fehlen).", sent: 0 };

  const subscribers = await db
    .select()
    .from(users)
    .where(and(eq(users.pushEnabled, true), isNotNull(users.pushSubscription)));

  let sent = 0;
  await Promise.all(
    subscribers.map(async (user) => {
      if (!user.pushSubscription) return;
      try {
        const subscription = JSON.parse(user.pushSubscription);
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        sent++;
      } catch (e: unknown) {
        const statusCode = (e as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.update(users).set({ pushSubscription: null, pushEnabled: false }).where(eq(users.id, user.id));
        }
        console.error("Push an User", user.id, "fehlgeschlagen:", e);
      }
    }),
  );

  return { success: true, sent };
}
