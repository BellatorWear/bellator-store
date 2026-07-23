"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/app/actions";
import { revalidatePath } from "next/cache";

export async function saveProfileBanner(bannerUrl: string): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Bitte einloggen." };
  if (!bannerUrl.startsWith("https://") || !bannerUrl.includes(".public.blob.vercel-storage.com/")) {
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
