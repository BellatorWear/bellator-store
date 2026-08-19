"use client";

/**
 * Läuft NUR innerhalb der Capacitor-App (echtes iOS/Android, kein
 * normaler Browser) - erkannt über Capacitor.isNativePlatform(). Im
 * normalen Browser bleibt der bisherige Web-Push-Weg (siehe
 * NotificationToggle.tsx) unverändert.
 *
 * Import von @capacitor/core ist bewusst dynamisch (await import), nicht
 * statisch oben in der Datei: die normale Web-Version der Seite (99% der
 * Aufrufe) soll das Capacitor-Paket gar nicht erst ins Bundle laden.
 */
export async function isNativeApp(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export type NativePushResult =
  | { success: true; token: string; platform: "ios" | "android" }
  | { success: false; error: string };

/**
 * Fordert die native Push-Berechtigung an und liefert den FCM/APNs-
 * Gerätetoken zurück. Der Aufrufer (NotificationToggle.tsx) schickt den
 * Token dann per togglePush-Action ans Backend (siehe app/actions.ts).
 */
export async function registerNativePush(): Promise<NativePushResult> {
  const { Capacitor } = await import("@capacitor/core");
  const { PushNotifications } = await import("@capacitor/push-notifications");

  const permStatus = await PushNotifications.checkPermissions();
  if (permStatus.receive === "prompt") {
    const requested = await PushNotifications.requestPermissions();
    if (requested.receive !== "granted") {
      return { success: false, error: "Berechtigung nicht erteilt." };
    }
  } else if (permStatus.receive !== "granted") {
    return { success: false, error: "Berechtigung blockiert - in den iOS/Android-Systemeinstellungen für diese App erlauben." };
  }

  return new Promise((resolve) => {
    // Capacitor liefert den Token asynchron per Event, nicht als
    // Rückgabewert von register() - deshalb Promise + Listener statt
    // eines simplen await.
    const successListener = PushNotifications.addListener("registration", (token) => {
      successListener.then((l) => l.remove());
      errorListener.then((l) => l.remove());
      resolve({
        success: true,
        token: token.value,
        platform: Capacitor.getPlatform() as "ios" | "android",
      });
    });
    const errorListener = PushNotifications.addListener("registrationError", (err) => {
      successListener.then((l) => l.remove());
      errorListener.then((l) => l.remove());
      resolve({ success: false, error: err.error || "Registrierung fehlgeschlagen." });
    });

    PushNotifications.register();
  });
}

export async function unregisterNativePush(): Promise<void> {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  await PushNotifications.removeAllListeners();
  await PushNotifications.unregister();
}
