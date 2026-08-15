"use client";

import { useEffect, useRef, useState } from "react";
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
 * - Sichtbarer Offline-Hinweis, wenn KEINE echte Verbindung besteht
 * - Automatisches Synchronisieren der Warenkorb-Offline-Queue, sobald die
 *   Verbindung zurückkommt (primärer Mechanismus, funktioniert auf allen
 *   Browsern inkl. iOS Safari - Background Sync in sw.js ist nur eine
 *   Zusatzabsicherung für Chrome/Android, siehe Kommentar dort)
 *
 * WICHTIG: navigator.onLine ist notorisch unzuverlässig - der Browser
 * prüft damit nur, ob das Betriebssystem irgendein Netzwerk als
 * "verbunden" meldet (WLAN/Ethernet-Link), NICHT ob tatsächlich Internet
 * da ist. Kann z.B. nach Standby, mit bestimmten VPN-Setups oder auf
 * manchen Windows-Konfigurationen fälschlich false melden, obwohl die
 * Seite ganz normal lädt - genau das führte zum fälschlichen
 * "OFFLINE"-Banner trotz funktionierender Verbindung. Deshalb wird
 * navigator.onLine hier nur noch als Trigger genutzt ("könnte sich was
 * geändert haben, lohnt sich ein echter Check") statt als Wahrheit -
 * verifiziert wird immer per echtem Fetch gegen /api/health.
 */
const HEALTH_CHECK_TIMEOUT_MS = 5000;
const OFFLINE_RECHECK_INTERVAL_MS = 20000;

async function checkRealConnectivity(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
  try {
    const res = await fetch("/api/health", { cache: "no-store", signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export default function OfflineSync() {
  // Startet immer optimistisch bei "online" - verhindert ein falsches
  // Offline-Banner-Aufblitzen direkt beim Laden, bis der erste echte
  // Check durchgelaufen ist (siehe Effect unten).
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const checkInFlight = useRef(false);

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

  // Echter Konnektivitäts-Check statt navigator.onLine blind zu glauben.
  // checkInFlight verhindert überlappende Checks, wenn z.B. das
  // 'offline'-Event und das Intervall gleichzeitig auslösen.
  async function verifyAndUpdate() {
    if (checkInFlight.current) return;
    checkInFlight.current = true;
    try {
      const reallyOnline = await checkRealConnectivity();
      setIsOnline((prev) => {
        if (!prev && reallyOnline) trySync(); // war offline, ist jetzt wirklich wieder online
        return reallyOnline;
      });
    } finally {
      checkInFlight.current = false;
    }
  }

  useEffect(() => {
    refreshPendingCount();
    verifyAndUpdate(); // einmaliger echter Check direkt beim Laden

    // navigator.onLine/die on-/offline-Events sind nur der ANLASS für
    // einen echten Check, nie die Entscheidung selbst.
    function handlePossibleChange() {
      verifyAndUpdate();
    }
    window.addEventListener("online", handlePossibleChange);
    window.addEventListener("offline", handlePossibleChange);

    // Sicherheitsnetz: falls fälschlich als offline markiert und aus
    // irgendeinem Grund nie ein online-Event feuert, alle 20s erneut
    // real nachprüfen statt dauerhaft im falschen Zustand hängen zu
    // bleiben.
    const interval = setInterval(() => {
      if (!isOnline) verifyAndUpdate();
    }, OFFLINE_RECHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", handlePossibleChange);
      window.removeEventListener("offline", handlePossibleChange);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

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
