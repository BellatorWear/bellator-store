import { Redis } from "@upstash/redis";

// Bewusst über Upstash Redis statt über die Postgres-"site_settings"-Tabelle
// (siehe app/utils/settings.ts): der ganze Sinn dieses Kill-Switches ist,
// nicht-kritische Features abzuschalten, WENN das System unter Last steht -
// dann noch zusätzliche Postgres-Reads auf jeder Seite zu erzeugen wäre
// kontraproduktiv. Redis ist ohnehin schon für Rate-Limiting im Einsatz und
// per REST-API sehr schnell erreichbar.
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const FLAG_KEY_PREFIX = "featureflag:";

// Nur wirklich NICHT-kritische Features hier eintragen - Checkout, Login,
// Warenkorb dürfen niemals über diesen Mechanismus abschaltbar sein, sonst
// wird aus einem "Last reduzieren"-Schalter ein "Umsatz abschalten"-Schalter.
export const FEATURE_FLAGS = {
  soundEffects: { key: "sound_effects", label: "Soundeffekte (Landingpage)" },
  reviewPopup: { key: "review_popup", label: "Bewertungs-Popup nach Kauf" },
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

// Kurzlebiger In-Memory-Cache pro Lambda-Instanz: erspart bei hoher
// Request-Rate trotzdem noch einen Redis-Roundtrip pro Request. 30s TTL ist
// unkritisch, weil ein Admin-Toggle sowieso keine Sofortwirkung auf die
// Sekunde braucht.
let cache: { values: Record<string, boolean>; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

/**
 * Liefert den aktuellen Zustand aller Feature-Flags. Fällt bei Redis-
 * Fehlern (z.B. Upstash kurz nicht erreichbar) bewusst auf "alles an"
 * zurück - ein Ausfall des Kill-Switches selbst darf niemals dazu führen,
 * dass Features für alle Nutzer verschwinden.
 */
export async function getFeatureFlags(): Promise<Record<FeatureFlagKey, boolean>> {
  const defaults = Object.fromEntries(
    Object.keys(FEATURE_FLAGS).map((k) => [k, true]),
  ) as Record<FeatureFlagKey, boolean>;

  if (cache && cache.expiresAt > Date.now()) {
    return { ...defaults, ...cache.values } as Record<FeatureFlagKey, boolean>;
  }

  try {
    const keys = Object.values(FEATURE_FLAGS).map((f) => `${FLAG_KEY_PREFIX}${f.key}`);
    const raw = await redis.mget<(string | null)[]>(...keys);
    const values: Record<string, boolean> = {};
    (Object.keys(FEATURE_FLAGS) as FeatureFlagKey[]).forEach((k, i) => {
      const v = raw[i];
      if (v !== null && v !== undefined) values[k] = v === "true" || v === "1";
    });
    cache = { values, expiresAt: Date.now() + CACHE_TTL_MS };
    return { ...defaults, ...values };
  } catch (error) {
    console.error("[featureFlags] Redis nicht erreichbar, Fallback auf 'alles an':", error);
    return defaults;
  }
}

/** Praktischer Helper, wenn nur ein einzelnes Flag interessiert. */
export async function isFeatureEnabled(flag: FeatureFlagKey): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[flag];
}

/** Admin-only: siehe requireAdmin()-Check im aufrufenden Server Action. */
export async function setFeatureFlag(flag: FeatureFlagKey, enabled: boolean): Promise<void> {
  const key = `${FLAG_KEY_PREFIX}${FEATURE_FLAGS[flag].key}`;
  await redis.set(key, String(enabled));
  cache = null; // Cache sofort invalidieren statt auf TTL zu warten
}
