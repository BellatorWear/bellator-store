"use client";

// IndexedDB statt localStorage: der Service Worker (public/sw.js) muss im
// Background-Sync-Fall (siehe Kommentar dort) selbst auf dieselbe Queue
// zugreifen können, während die Seite evtl. gar nicht offen ist -
// localStorage ist aus Service-Worker-Kontext heraus nicht erreichbar,
// IndexedDB schon. Deshalb wird dieselbe DB/Store-Struktur hier UND in
// sw.js verwendet (Namen müssen exakt übereinstimmen).
const DB_NAME = "bellator-offline";
const DB_VERSION = 1;
export const CART_QUEUE_STORE = "cart-queue";

export type QueuedCartItem = {
  clientId: string; // uuid, verhindert doppeltes Einreihen bei mehrfachem Klick
  productId: number;
  variantId: number | null;
  colorId: number | null;
  quantity: number;
  productName: string; // nur für die "wird synchronisiert"-Anzeige, keine DB-Quelle
  queuedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CART_QUEUE_STORE)) {
        db.createObjectStore(CART_QUEUE_STORE, { keyPath: "clientId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueCartItem(item: Omit<QueuedCartItem, "queuedAt">): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(CART_QUEUE_STORE, "readwrite");
    tx.objectStore(CART_QUEUE_STORE).put({ ...item, queuedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();

  // Best-effort Background Sync (nur Chrome/Edge/Android) - siehe
  // "sync"-Event-Handler in public/sw.js. Schlägt auf Browsern ohne
  // Unterstützung (Safari/Firefox) einfach mit einer Exception fehl, die
  // wir hier bewusst ignorieren: der 'online'-Event-Listener in
  // OfflineSync.tsx bleibt so oder so der primäre Sync-Mechanismus.
  try {
    const registration = await navigator.serviceWorker.ready;
    if ("sync" in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register("cart-sync");
    }
  } catch {
    // Kein Background Sync verfügbar - unkritisch, siehe Kommentar oben.
  }
}

export async function getQueuedCartItems(): Promise<QueuedCartItem[]> {
  const db = await openDb();
  const items = await new Promise<QueuedCartItem[]>((resolve, reject) => {
    const tx = db.transaction(CART_QUEUE_STORE, "readonly");
    const req = tx.objectStore(CART_QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueuedCartItem[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items;
}

async function removeQueuedCartItems(clientIds: string[]): Promise<void> {
  if (clientIds.length === 0) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(CART_QUEUE_STORE, "readwrite");
    const store = tx.objectStore(CART_QUEUE_STORE);
    clientIds.forEach((id) => store.delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/**
 * Sendet alle offline gequeueten Warenkorb-Aktionen an /api/cart/sync und
 * entfernt erfolgreich verarbeitete Einträge aus der Queue. Wird
 * aufgerufen: (a) beim 'online'-Browserevent (funktioniert überall,
 * inkl. iOS Safari, das die Background Sync API nicht unterstützt), und
 * (b) optional zusätzlich vom Service Worker per Background Sync auf
 * unterstützten Browsern (siehe sw.js) - deshalb idempotent gehalten:
 * ein Eintrag, der schon synced wurde, existiert beim zweiten Aufruf
 * einfach nicht mehr in der Queue.
 */
export async function flushCartQueue(): Promise<{ synced: number; failed: number }> {
  const items = await getQueuedCartItems();
  if (items.length === 0) return { synced: 0, failed: 0 };

  try {
    const res = await fetch("/api/cart/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map(({ clientId, productId, variantId, colorId, quantity }) => ({
          clientId, productId, variantId, colorId, quantity,
        })),
      }),
    });
    if (!res.ok) return { synced: 0, failed: items.length };

    const { results } = (await res.json()) as { results: { clientId: string; success: boolean }[] };
    const succeededIds = results.filter((r) => r.success).map((r) => r.clientId);
    await removeQueuedCartItems(succeededIds);
    return { synced: succeededIds.length, failed: results.length - succeededIds.length };
  } catch {
    // Netzwerk doch wieder weg o.ä. - Queue bleibt erhalten, nächster
    // 'online'-Event oder App-Neustart versucht es erneut.
    return { synced: 0, failed: items.length };
  }
}
