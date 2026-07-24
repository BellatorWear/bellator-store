"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/app/actions";
import { revalidatePath } from "next/cache";

export async function saveProfileBanner(bannerUrl: string): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Bitte einloggen." };

  let parsed: URL;
  try {
    parsed = new URL(bannerUrl);
  } catch {
    return { error: "Ungültige Banner-URL." };
  }
  // Nicht nur "irgendeine" öffentliche Blob-URL im Store akzeptieren
  // (sonst könnte man sich fremde Uploads - z.B. das Foto eines anderen
  // Users - einfach als eigenes Banner eintragen), sondern nur eine, die
  // tatsächlich unter dem eigenen banner-upload-Präfix liegt.
  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname.endsWith(".public.blob.vercel-storage.com") ||
    !parsed.pathname.includes(`/banners/${user.id}-`)
  ) {
    return { error: "Ungültige Banner-URL." };
  }

  await db.update(users).set({ bannerUrl }).where(eq(users.id, user.id));
  revalidatePath("/profil");
  revalidatePath("/einstellungen");
  return { success: true };
}

export async function removeProfileBanner(): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Bitte einloggen." };

  await db.update(users).set({ bannerUrl: null }).where(eq(users.id, user.id));
  revalidatePath("/profil");
  revalidatePath("/einstellungen");
  return { success: true };
}
