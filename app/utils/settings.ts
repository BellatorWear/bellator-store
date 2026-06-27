import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    if (rows.length === 0) return fallback;
    return JSON.parse(rows[0].value) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await db
    .insert(siteSettings)
    .values({ key, value: json })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: json, updatedAt: new Date() } });
}

export type CountdownSetting = { enabled: boolean; targetDate: string; label: string };
export const COUNTDOWN_KEY = "countdown";
export const COUNTDOWN_DEFAULT: CountdownSetting = {
  enabled: true,
  targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  label: "Nächster Drop in",
};

export type ExclusiveCodeSetting = {
  enabled: boolean;
  firstNOrders: number; // Code gilt für die ersten N Bestellungen insgesamt
  percentOff: number;
};
export const EXCLUSIVE_CODE_KEY = "exclusive_first_orders";
export const EXCLUSIVE_CODE_DEFAULT: ExclusiveCodeSetting = {
  enabled: false,
  firstNOrders: 50,
  percentOff: 15,
};
