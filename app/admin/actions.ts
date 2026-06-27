"use server";
import { db } from "@/db";
import { products, productVariants, discountCodes, newsPosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { getCurrentUser } from "@/app/actions";
import { sanitizeText, isSuspiciousInput } from "@/app/utils/inputSafety";
import { isTrustedOrigin } from "@/app/utils/origin";
import { setSetting, COUNTDOWN_KEY, EXCLUSIVE_CODE_KEY } from "@/app/utils/settings";
import { sendPushToAll } from "@/app/utils/push";
import { sendNewsletterEmailToAll } from "@/app/utils/newsletterMail";

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
  const compareAtPriceRaw = formData.get("compareAtPrice") as string;
  const dropLimitRaw = formData.get("dropLimit") as string;
  const dropLabelRaw = (formData.get("dropLabel") as string) ?? "";

  if (isSuspiciousInput(nameRaw) || isSuspiciousInput(descriptionRaw)) {
    return { error: "Ungültige Eingabe." };
  }
  const name = sanitizeText(nameRaw, 80);
  const description = sanitizeText(descriptionRaw, 1000);
  if (!name || !description) return { error: "Name und Beschreibung erforderlich." };
  if (!priceEuro || priceEuro <= 0) return { error: "Ungültiger Preis." };

  const compareAtPriceEuro = compareAtPriceRaw && compareAtPriceRaw !== "" ? parseFloat(compareAtPriceRaw) : null;
  if (compareAtPriceEuro !== null && (isNaN(compareAtPriceEuro) || compareAtPriceEuro <= priceEuro)) {
    return { error: "Der alte Preis muss höher als der neue Preis sein." };
  }

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
    compareAtPriceCents: compareAtPriceEuro !== null ? Math.round(compareAtPriceEuro * 100) : null,
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
  const compareAtPriceRaw = formData.get("compareAtPrice") as string;
  const active = formData.get("active") === "true";
  const dropLabelRaw = (formData.get("dropLabel") as string) ?? "";
  const dropLimitRaw = formData.get("dropLimit") as string;

  if (isSuspiciousInput(nameRaw) || isSuspiciousInput(descriptionRaw)) {
    return { error: "Ungültige Eingabe." };
  }
  if (!priceEuro || priceEuro <= 0) return { error: "Ungültiger Preis." };

  const compareAtPriceEuro = compareAtPriceRaw && compareAtPriceRaw !== "" ? parseFloat(compareAtPriceRaw) : null;
  if (compareAtPriceEuro !== null && (isNaN(compareAtPriceEuro) || compareAtPriceEuro <= priceEuro)) {
    return { error: "Der alte Preis muss höher als der neue Preis sein." };
  }

  const dropLimit = dropLimitRaw && dropLimitRaw !== "" ? parseInt(dropLimitRaw, 10) : null;

  // Bilder sind optional bearbeitbar - wird das Feld gar nicht mitgeschickt,
  // bleiben die bestehenden Bilder unverändert (z.B. wenn nur der Preis
  // geändert wird, ohne die Bilder-Sektion zu berühren).
  const imageEntries = formData.getAll("images");
  const images = imageEntries.length > 0
    ? imageEntries.filter((e): e is string => typeof e === "string" && isOwnBlobUrl(e)).slice(0, MAX_IMAGES_PER_PRODUCT)
    : undefined;

  await db
    .update(products)
    .set({
      name: sanitizeText(nameRaw, 80),
      description: sanitizeText(descriptionRaw, 1000),
      priceCents: Math.round(priceEuro * 100),
      compareAtPriceCents: compareAtPriceEuro !== null ? Math.round(compareAtPriceEuro * 100) : null,
      active,
      dropLabel: isSuspiciousInput(dropLabelRaw) ? null : sanitizeText(dropLabelRaw, 40) || null,
      dropLimit: dropLimit && dropLimit > 0 ? dropLimit : null,
      ...(images !== undefined ? { images } : {}),
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

// ===================================================================
// Countdown (siteSettings statt localStorage - gilt jetzt für ALLE
// Besucher, nicht nur den Browser des Admins).
// ===================================================================
export async function saveCountdownSetting(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const enabled = formData.get("enabled") === "true";
  const targetDate = (formData.get("targetDate") as string) ?? "";
  const labelRaw = (formData.get("label") as string) ?? "";
  if (isSuspiciousInput(labelRaw)) return { error: "Ungültige Eingabe." };

  await setSetting(COUNTDOWN_KEY, {
    enabled,
    targetDate,
    label: sanitizeText(labelRaw, 60) || "Nächster Drop in",
  });

  return { success: true };
}

// ===================================================================
// Exklusive Rabattcodes für die ersten N Bestellungen
// ===================================================================
export async function saveExclusiveCodeSetting(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const enabled = formData.get("enabled") === "true";
  const firstNOrders = parseInt((formData.get("firstNOrders") as string) ?? "0", 10) || 0;
  const percentOff = parseInt((formData.get("percentOff") as string) ?? "0", 10) || 0;
  const codeRaw = ((formData.get("code") as string) ?? "").trim().toUpperCase();

  if (enabled) {
    if (!codeRaw || codeRaw.length < 3 || codeRaw.length > 20) {
      return { error: "Bitte einen Code zwischen 3 und 20 Zeichen angeben." };
    }
    if (percentOff <= 0 || percentOff > 90) return { error: "Ungültiger Rabatt." };
    if (firstNOrders <= 0) return { error: "Ungültige Anzahl Bestellungen." };
    if (!process.env.STRIPE_SECRET_KEY) {
      return { error: "Stripe ist nicht konfiguriert (STRIPE_SECRET_KEY fehlt)." };
    }

    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    try {
      const existing = await db.select().from(discountCodes).where(eq(discountCodes.code, codeRaw));
      if (existing.length === 0) {
        const coupon = await stripe.coupons.create({
          percent_off: percentOff,
          duration: "once",
          name: `Exklusiv erste ${firstNOrders} Bestellungen`,
        });
        const promo = await stripe.promotionCodes.create({
          promotion: { type: "coupon", coupon: coupon.id },
          code: codeRaw,
          max_redemptions: firstNOrders,
        });
        await db.insert(discountCodes).values({
          code: codeRaw,
          percentOff,
          source: "exclusive_first_orders",
          stripeCouponId: coupon.id,
          stripePromotionCodeId: promo.id,
          maxRedemptions: firstNOrders,
        });
      } else {
        // Bereits angelegt - nur lokale Limits aktualisieren. Stripe selbst
        // erlaubt kein nachträgliches Ändern von max_redemptions, daher
        // bleibt der ursprüngliche Stripe-Code-Wert bestehen.
        await db
          .update(discountCodes)
          .set({ percentOff })
          .where(eq(discountCodes.code, codeRaw));
      }
    } catch (e) {
      console.error("Exklusiver Rabattcode Fehler:", e);
      return { error: "Code konnte nicht bei Stripe angelegt werden (existiert er dort schon anders?)." };
    }
  }

  await setSetting(EXCLUSIVE_CODE_KEY, { enabled, firstNOrders, percentOff, code: codeRaw });
  return { success: true };
}

// ===================================================================
// News-Channel: Post anlegen + sofort als Push + Newsletter-Mail raus
// ===================================================================
export async function createNewsPost(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const titleRaw = (formData.get("title") as string) ?? "";
  const bodyRaw = (formData.get("body") as string) ?? "";
  if (isSuspiciousInput(titleRaw) || isSuspiciousInput(bodyRaw)) {
    return { error: "Ungültige Eingabe." };
  }
  const title = sanitizeText(titleRaw, 100);
  const body = sanitizeText(bodyRaw, 2000);
  if (!title || !body) return { error: "Titel und Text erforderlich." };

  const [post] = await db.insert(newsPosts).values({ title, body }).returning({ id: newsPosts.id });

  const pushResult = await sendPushToAll({ title, body, url: "/shop" });
  if (!("error" in pushResult)) {
    await db.update(newsPosts).set({ pushSentAt: new Date() }).where(eq(newsPosts.id, post.id));
  }

  const emailResult = await sendNewsletterEmailToAll(title, body);
  if (emailResult.sent > 0) {
    await db.update(newsPosts).set({ emailSentAt: new Date() }).where(eq(newsPosts.id, post.id));
  }

  return {
    success: true,
    pushSent: "sent" in pushResult ? pushResult.sent : 0,
    pushError: "error" in pushResult ? pushResult.error : null,
    emailSent: emailResult.sent,
    emailError: emailResult.error,
  };
}
