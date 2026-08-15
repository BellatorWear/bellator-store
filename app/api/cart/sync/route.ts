import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions";
import { addToCartForUser } from "@/app/cart";
import { isTrustedOrigin } from "@/app/utils/origin";
import { checkGeneralRateLimit } from "@/app/utils/ratelimit";

const MAX_BATCH_SIZE = 20;

/**
 * Nimmt eine Batch von "In den Warenkorb"-Aktionen entgegen, die während
 * Offline-Zeit im Service Worker (siehe public/sw.js) bzw. clientseitig
 * in der IndexedDB gequeued wurden (siehe app/utils/offlineQueue.ts), und
 * schreibt sie jetzt, wo wieder eine Verbindung besteht, in die DB.
 *
 * Bewusst ein eigener Route Handler statt die addToCart-Server-Action
 * wiederzuverwenden: Server Actions verschlüsseln ihre Aufruf-ID pro
 * Next.js-Build (Next-Action-Header) - das aus einem Service Worker oder
 * nach einem Reload zuverlässig zu replayen ist fragil und bricht bei
 * jedem Deploy. Ein normaler Route Handler mit stabiler URL/JSON-Body ist
 * dafür robust. Die eigentliche Cart-Logik (addToCartForUser) ist mit der
 * Server Action geteilt, nicht dupliziert.
 *
 * Nur für eingeloggte User (wie addToCart auch) - das Auth-Cookie bleibt
 * auch offline im Browser bestehen, ist beim Sync-Request also automatisch
 * vorhanden.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!(await isTrustedOrigin())) {
    return NextResponse.json({ error: "Anfrage abgelehnt." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });

  const rateLimit = await checkGeneralRateLimit();
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Zu viele Anfragen - kurz warten." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request." }, { status: 400 });
  }

  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Keine Einträge." }, { status: 400 });
  }
  if (items.length > MAX_BATCH_SIZE) {
    return NextResponse.json({ error: "Zu viele Einträge auf einmal." }, { status: 400 });
  }

  const ownerKey = `user:${user.id}`;
  const results: { clientId: string; success: boolean; error?: string }[] = [];

  for (const raw of items) {
    const item = raw as { clientId?: string; productId?: number; variantId?: number | null; colorId?: number | null; quantity?: number };
    const clientId = typeof item.clientId === "string" ? item.clientId : "";
    const productId = Number(item.productId);
    if (!clientId || !productId) {
      results.push({ clientId: clientId || "unbekannt", success: false, error: "Ungültiger Eintrag." });
      continue;
    }
    const res = await addToCartForUser(ownerKey, {
      productId,
      variantId: item.variantId ? Number(item.variantId) : null,
      colorId: item.colorId ? Number(item.colorId) : null,
      quantity: Number(item.quantity) || 1,
    });
    results.push({ clientId, success: !!("success" in res && res.success), error: "error" in res ? res.error : undefined });
  }

  return NextResponse.json({ results });
}
