import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

type PushPayload = { title: string; body: string; url?: string };

async function getWebPush() {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return null;
  }
  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:info@mz-dev.de",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  return webpush;
}

/**
 * Native Push (FCM) für die Capacitor-App - GETRENNT von Web Push oben,
 * unterschiedliche Anbieter/Protokolle. Setup nötig (kann ich nicht für
 * Michael automatisieren, braucht sein eigenes Firebase-Projekt):
 * 1. https://console.firebase.google.com -> neues Projekt (kostenlos)
 * 2. Projekteinstellungen -> Dienstkonten -> "Neuen privaten Schlüssel
 *    generieren" -> lädt eine JSON-Datei herunter
 * 3. Kompletten Inhalt dieser JSON-Datei als Vercel-Env-Var
 *    FIREBASE_SERVICE_ACCOUNT_JSON eintragen (als ein-Zeilen-String)
 * 4. Für Android: google-services.json aus Firebase in android/app/
 *    legen (siehe MOBILE_APP_SETUP.md)
 * 5. Für iOS: APNs-Auth-Key bei Apple erstellen, in der Firebase-Konsole
 *    unter Cloud Messaging -> Apple-App-Konfiguration hochladen (Firebase
 *    übernimmt dann das Zustellen an APNs für dich, ein SDK für beide
 *    Plattformen)
 *
 * Fail-open wie bei Turnstile/Snyk: ohne Konfiguration wird native Push
 * einfach übersprungen, Web Push funktioniert unabhängig davon weiter.
 */
let firebaseApp: import("firebase-admin/app").App | null | undefined;

async function getFirebaseApp() {
  if (firebaseApp !== undefined) return firebaseApp;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    firebaseApp = null;
    return null;
  }

  try {
    const { initializeApp, cert, getApps } = await import("firebase-admin/app");
    const existing = getApps();
    if (existing.length > 0) {
      firebaseApp = existing[0];
    } else {
      firebaseApp = initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
    }
  } catch (e) {
    console.error("[nativePush] Firebase-Initialisierung fehlgeschlagen:", e);
    firebaseApp = null;
  }
  return firebaseApp;
}

async function sendNativePush(token: string, payload: PushPayload): Promise<{ success: boolean; invalidToken?: boolean }> {
  const app = await getFirebaseApp();
  if (!app) return { success: false };

  try {
    const { getMessaging } = await import("firebase-admin/messaging");
    await getMessaging(app).send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.url ? { url: payload.url } : undefined,
    });
    return { success: true };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    // Token nicht mehr gültig (App deinstalliert o.ä.) -> aufräumen.
    const invalidToken = code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token";
    if (!invalidToken) console.error("[nativePush] Senden fehlgeschlagen:", e);
    return { success: false, invalidToken };
  }
}

export async function sendPushToUser(userId: number, payload: PushPayload) {
  const result = await db.select().from(users).where(eq(users.id, userId));
  const user = result[0];
  if (!user) return { error: "User nicht gefunden." };

  // Native App (Capacitor) hat Vorrang, falls beide Kanäle vorhanden -
  // in der Praxis hat ein User nur einen der beiden aktiv (togglePush
  // räumt den jeweils anderen Kanal beim Umschalten auf).
  if (user.nativePushToken) {
    const { success, invalidToken } = await sendNativePush(user.nativePushToken, payload);
    if (invalidToken) {
      await db.update(users).set({ nativePushToken: null, pushEnabled: false }).where(eq(users.id, userId));
    }
    return success ? { success: true } : { error: "Native Push fehlgeschlagen oder nicht konfiguriert." };
  }

  const webpush = await getWebPush();
  if (!webpush) return { error: "Push ist nicht konfiguriert (VAPID Keys fehlen)." };
  if (!user.pushSubscription) return { error: "Keine Subscription vorhanden." };

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
  const webpush = await getWebPush();
  const firebaseConfigured = !!(await getFirebaseApp());
  if (!webpush && !firebaseConfigured) {
    return { error: "Push ist nicht konfiguriert (weder VAPID noch Firebase).", sent: 0 };
  }

  const subscribers = await db
    .select()
    .from(users)
    .where(and(eq(users.pushEnabled, true), isNotNull(users.pushSubscription)));
  const nativeSubscribers = await db
    .select()
    .from(users)
    .where(and(eq(users.pushEnabled, true), isNotNull(users.nativePushToken)));

  let sent = 0;
  await Promise.all([
    ...subscribers.map(async (user) => {
      if (!webpush || !user.pushSubscription) return;
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
    ...nativeSubscribers.map(async (user) => {
      if (!user.nativePushToken) return;
      const { success, invalidToken } = await sendNativePush(user.nativePushToken, payload);
      if (invalidToken) {
        await db.update(users).set({ nativePushToken: null, pushEnabled: false }).where(eq(users.id, user.id));
      }
      if (success) sent++;
    }),
  ]);

  return { success: true, sent };
}
