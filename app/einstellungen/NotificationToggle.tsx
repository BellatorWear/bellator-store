"use client";
import { useState } from "react";
import { handleAction } from "@/app/actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function NotificationToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function toggle() {
    if (loading) return;
    setLoading(true);
    setMsg("");

    try {
      if (!enabled) {
        if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
          setMsg("Dein Browser unterstützt keine Push-Benachrichtigungen.");
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setMsg("Berechtigung verweigert.");
          return;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          setMsg("Push ist serverseitig noch nicht eingerichtet (VAPID Key fehlt).");
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        });

        const fd = new FormData();
        fd.append("actionType", "togglePush");
        fd.append("enable", "true");
        fd.append("subscription", JSON.stringify(subscription));
        const res = await handleAction(fd);
        if (res?.error) {
          setMsg(res.error);
          return;
        }
        setEnabled(true);
        setMsg("Push-Benachrichtigungen aktiviert!");
      } else {
        // Subscription auch lokal beenden, nicht nur serverseitig löschen.
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration("/sw.js");
          const sub = await registration?.pushManager.getSubscription();
          if (sub) await sub.unsubscribe();
        }
        const fd = new FormData();
        fd.append("actionType", "togglePush");
        fd.append("enable", "false");
        await handleAction(fd);
        setEnabled(false);
        setMsg("Push-Benachrichtigungen deaktiviert.");
      }
    } catch (e) {
      console.error("Push Toggle fehlgeschlagen:", e);
      setMsg("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={toggle} disabled={loading}
        className={`relative w-14 h-7 border transition-all disabled:opacity-50 ${enabled ? "border-white bg-white" : "t-border t-card"}`}>
        <span className={`absolute top-1 w-5 h-5 transition-all ${enabled ? "right-1 bg-black" : "left-1 bg-white"}`} />
      </button>
      {msg && <p className="text-[9px] t-muted max-w-[140px] text-right">{msg}</p>}
    </div>
  );
}
