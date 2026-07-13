import Pusher from "pusher";

/**
 * Server-seitiger Pusher-Client für den Team-Chat. Erfordert einen (kostenlosen)
 * Pusher-Channels-App unter https://dashboard.pusher.com/ - das kann ich nicht
 * für dich anlegen, siehe .env.example für die benötigten Variablen.
 *
 * Lazy instanziert (nicht beim Modul-Import), damit ein fehlendes Setup nicht
 * gleich den ganzen Server-Start crasht, sondern erst beim tatsächlichen
 * Versuch, eine Chat-Nachricht zu senden, einen klaren Fehler wirft.
 */
let instance: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (instance) return instance;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error(
      "Pusher ist nicht konfiguriert. Bitte PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, " +
        "PUSHER_SECRET und NEXT_PUBLIC_PUSHER_CLUSTER in .env.local setzen " +
        "(siehe .env.example) - Werte kommen aus dem Pusher-Dashboard.",
    );
  }

  instance = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return instance;
}

/** Kanalname für einen einzelnen Chat-Channel (privat: nur Mitglieder dürfen subscriben). */
export function channelEventName(channelId: number): string {
  return `private-chat-${channelId}`;
}

/** Kanalname für die persönlichen Updates eines Users (neue Channels/DMs, die er noch nicht kennt). */
export function userEventName(userId: number): string {
  return `private-chat-user-${userId}`;
}
