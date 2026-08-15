"use client";

import { useEffect, useState } from "react";
import { flushCartQueue, getQueuedCartItems } from "@/app/utils/offlineQueue";

/**
 * Läuft global im Root-Layout (siehe app/layout.tsx), unabhängig davon ob
 * der User Push-Benachrichtigungen aktiviert hat (das war vorher der
 * einzige Ort, an dem der Service Worker registriert wurde - dadurch
 * bekamen User ohne Push-Opt-in auch kein Offline-Caching, obwohl beides
 * technisch nichts miteinander zu tun hat).
 *
 * Zuständig für:
 * - Service-Worker-Registrierung (Offline-Caching, siehe public/sw.js)
 * - Sichtbarer Offline-Hinweis, wenn keine Verbindung besteht
 * - Automatisches Synchronisieren der Warenkorb-Offline-Queue, sobald die
 *   Verbindung zurückkommt (primärer Mechanismus, funktioniert auf allen
 *   Browsern inkl. iOS Safari - Background Sync in sw.js ist nur eine
 *   Zusatzabsicherung für Chrome/Android, siehe Kommentar dort)
 */
export default function OfflineSync() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [pendingCount, setPendingCount] = useState(0);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service Worker Registrierung fehlgeschlagen:", err);
    });

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "cart-queue-synced") {
        refreshPendingCount();
        setSyncMsg("✓ Warenkorb synchronisiert");
        setTimeout(() => setSyncMsg(null), 4000);
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  async function refreshPendingCount() {
    try {
      const items = await getQueuedCartItems();
      setPendingCount(items.length);
    } catch {
      // IndexedDB evtl. nicht verfügbar (Privatmodus etc.) - unkritisch,
      // dann läuft die App einfach ohne Offline-Queue-Anzeige weiter.
    }
  }

  async function trySync() {
    const { synced } = await flushCartQueue();
    if (synced > 0) {
      setSyncMsg(`✓ ${synced} Warenkorb-Aktion${synced === 1 ? "" : "en"} synchronisiert`);
      setTimeout(() => setSyncMsg(null), 4000);
    }
    refreshPendingCount();
  }

  useEffect(() => {
    refreshPendingCount();

    function handleOnline() {
      setIsOnline(true);
      trySync();
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Direkt beim Laden versuchen, falls schon online mit liegengebliebener
    // Queue (z.B. App war zu, während sie noch offline war, Verbindung kam
    // zurück, ohne dass diese Seite das online-Event mitbekommen hätte).
    // Als eigene async IIFE statt direktem Aufruf, damit setState garantiert
    // erst nach einem await passiert (nicht synchron im Effect-Body).
    let cancelled = false;
    (async () => {
      if (!navigator.onLine) return;
      const { synced } = await flushCartQueue();
      if (cancelled) return;
      if (synced > 0) {
        setSyncMsg(`✓ ${synced} Warenkorb-Aktion${synced === 1 ? "" : "en"} synchronisiert`);
        setTimeout(() => setSyncMsg(null), 4000);
      }
      refreshPendingCount();
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isOnline && !syncMsg) return null;

  return (
    <div
      role="status"
      className={`fixed top-0 inset-x-0 z-[100] text-center text-[11px] uppercase tracking-widest py-2 px-4 transition-colors ${
        isOnline ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-200 border-b border-zinc-700"
      }`}
    >
      {isOnline
        ? syncMsg
        : `Offline${pendingCount > 0 ? ` — ${pendingCount} Aktion${pendingCount === 1 ? "" : "en"} werden synchronisiert, sobald du wieder online bist` : ""}`}
    </div>
  );
}
