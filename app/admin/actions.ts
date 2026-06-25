"use server";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { getCurrentUser } from "@/app/actions";
import { sanitizeText, isSuspiciousInput } from "@/app/utils/inputSafety";
import { isTrustedOrigin } from "@/app/utils/origin";

const MAX_IMAGES_PER_PRODUCT = 4;

// Bilder werden jetzt direkt vom Browser zu Vercel Blob hochgeladen (siehe
// app/api/admin/upload/route.ts) - hier kommt nur noch die fertige URL an,
// kein Base64 mehr. Wir prüfen, dass es WIRKLICH eine URL aus unserem
// eigenen Blob-Store ist, damit niemand beliebige externe Bild-URLs
// einschleusen kann (z.B. um andere User auf fremde Server zu locken).
function isOwnBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

async function requireAdmin() {
  if (!(await isTrustedOrigin())) return null;
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return null;
  return user;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createProduct(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const nameRaw = (formData.get("name") as string) ?? "";
  const descriptionRaw = (formData.get("description") as string) ?? "";
  const priceEuro = parseFloat((formData.get("price") as string) ?? "0");
  const dropLimitRaw = formData.get("dropLimit") as string;
  const dropLabelRaw = (formData.get("dropLabel") as string) ?? "";

  if (isSuspiciousInput(nameRaw) || isSuspiciousInput(descriptionRaw)) {
    return { error: "Ungültige Eingabe." };
  }
  const name = sanitizeText(nameRaw, 80);
  const description = sanitizeText(descriptionRaw, 1000);
  if (!name || !description) return { error: "Name und Beschreibung erforderlich." };
  if (!priceEuro || priceEuro <= 0) return { error: "Ungültiger Preis." };

  const images: string[] = [];
  for (const entry of formData.getAll("images")) {
    if (typeof entry !== "string" || !entry) continue;
    if (!isOwnBlobUrl(entry)) continue; // nur echte Blob-URLs, keine fremden/beliebigen
    if (images.length < MAX_IMAGES_PER_PRODUCT) images.push(entry);
  }

  const baseSlug = slugify(name) || "produkt";
  let slug = baseSlug;
  let suffix = 1;
  while ((await db.select().from(products).where(eq(products.slug, slug))).length > 0) {
    slug = `${baseSlug}-${++suffix}`;
  }

  const dropLimit = dropLimitRaw && dropLimitRaw !== "" ? parseInt(dropLimitRaw, 10) : null;

  await db.insert(products).values({
    slug,
    name,
    description,
    priceCents: Math.round(priceEuro * 100),
    images,
    dropLabel: isSuspiciousInput(dropLabelRaw) ? null : sanitizeText(dropLabelRaw, 40) || null,
    dropLimit: dropLimit && dropLimit > 0 ? dropLimit : null,
  });

  return { success: true };
}

export async function updateProduct(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Ungültiges Produkt." };

  const nameRaw = (formData.get("name") as string) ?? "";
  const descriptionRaw = (formData.get("description") as string) ?? "";
  const priceEuro = parseFloat((formData.get("price") as string) ?? "0");
  const active = formData.get("active") === "true";

  if (isSuspiciousInput(nameRaw) || isSuspiciousInput(descriptionRaw)) {
    return { error: "Ungültige Eingabe." };
  }

  await db
    .update(products)
    .set({
      name: sanitizeText(nameRaw, 80),
      description: sanitizeText(descriptionRaw, 1000),
      priceCents: Math.round(priceEuro * 100),
      active,
    })
    .where(eq(products.id, id));

  return { success: true };
}

export async function deleteProduct(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Ungültiges Produkt." };

  const existing = await db.select().from(products).where(eq(products.id, id));

  await db.delete(productVariants).where(eq(productVariants.productId, id));
  await db.delete(products).where(eq(products.id, id));

  // Zugehörige Bilder im Blob-Store auch löschen, sonst sammeln sich dort
  // verwaiste Dateien an (kostet Speicherplatz).
  const images = existing[0]?.images ?? [];
  for (const url of images) {
    try {
      await del(url);
    } catch (e) {
      console.error("Konnte Blob nicht löschen:", url, e);
    }
  }

  return { success: true };
}

export async function addVariant(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const productId = Number(formData.get("productId"));
  const labelRaw = (formData.get("label") as string) ?? "";
  const stockRaw = formData.get("stock") as string;
  if (!productId || isSuspiciousInput(labelRaw)) return { error: "Ungültige Eingabe." };

  const label = sanitizeText(labelRaw, 40);
  if (!label) return { error: "Bezeichnung erforderlich." };

  const stock = stockRaw && stockRaw !== "" ? parseInt(stockRaw, 10) : null;

  await db.insert(productVariants).values({
    productId,
    label,
    stock: stock !== null && stock >= 0 ? stock : null,
  });

  return { success: true };
}

export async function deleteVariant(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Ungültig." };
  await db.delete(productVariants).where(eq(productVariants.id, id));
  return { success: true };
}
