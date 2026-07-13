"use server";
import { db } from "@/db";
import { products, productVariants, productColors, discountCodes, newsPosts, users, usernameHistory, preReleaseCodes, preReleaseRedemptions, homePosts } from "@/db/schema";
import { eq, ilike, desc } from "drizzle-orm";
import { del, list } from "@vercel/blob";
import { getCurrentUser } from "@/app/actions";
import { sanitizeText, isSuspiciousInput, sanitizeHtml } from "@/app/utils/inputSafety";
import { hasSection, canEditPosts, isValidRole, type Role, type AdminSectionId, type ChatRoleAccess } from "./permissions";
import { isTrustedOrigin } from "@/app/utils/origin";
import { setSetting, COUNTDOWN_KEY, EXCLUSIVE_CODE_KEY, CHAT_ROLE_ACCESS_KEY } from "@/app/utils/settings";
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

// Für Team-Mitglieder mit eingeschränkter Rolle (Developer/Marketing) statt
// vollem Admin-Zugriff. section wird gegen die Presets in permissions.ts
// geprüft - volle Admins (isAdmin/role 'admin') dürfen immer.
async function requireRole(section: AdminSectionId) {
  if (!(await isTrustedOrigin())) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const role: Role | null = isValidRole(user.role) ? user.role : (user.isAdmin ? "admin" : null);
  if (!hasSection(role, section)) return null;
  return { ...user, resolvedRole: role };
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
  const isPreRelease = formData.get("isPreRelease") === "true";
  const dropDateRaw = (formData.get("dropDate") as string) ?? "";
  const dropDate = dropDateRaw ? new Date(dropDateRaw) : null;
  if (dropDateRaw && (!dropDate || isNaN(dropDate.getTime()))) {
    return { error: "Ungültiges Drop-Datum." };
  }
  const categoryRaw = (formData.get("category") as string) ?? "";
  const genderRaw = (formData.get("gender") as string) ?? "unisex";
  const collectionRaw = (formData.get("collection") as string) ?? "";
  const category = ["shirt","hoodie","ziphoodie","pants","set"].includes(categoryRaw) ? categoryRaw : null;
  const gender = ["male","female","unisex"].includes(genderRaw) ? genderRaw : "unisex";
  const collection = isSuspiciousInput(collectionRaw) ? null : sanitizeText(collectionRaw, 40) || null;

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

  // Größen kommen als wiederholte "sizes"-Felder (jeweils nur die Größen-
  // Bezeichnung, z.B. "M") - werden nach dem Anlegen als product_variants
  // mit dieser Bezeichnung als Label angelegt.
  const sizes = formData
    .getAll("sizes")
    .filter((s): s is string => typeof s === "string" && s.trim() !== "")
    .map((s) => sanitizeText(s, 20))
    .filter(Boolean)
    .slice(0, 12);

  // Farben kommen als EIN JSON-Feld "colors" (Array von {name, hexColor,
  // frontImage, backImage}) - das Formular sammelt sie clientseitig, bevor
  // das Produkt überhaupt existiert (kein productId für eine eigene
  // Server-Action pro Farbe möglich).
  const colorsRaw = (formData.get("colors") as string) ?? "[]";
  let parsedColors: { name: string; hexColor: string; frontImage: string; backImage: string }[] = [];
  try {
    const parsed = JSON.parse(colorsRaw);
    if (Array.isArray(parsed)) parsedColors = parsed;
  } catch {
    return { error: "Ungültige Farb-Daten." };
  }
  for (const c of parsedColors) {
    if (
      isSuspiciousInput(c?.name ?? "") ||
      typeof c?.hexColor !== "string" ||
      !/^#[0-9a-fA-F]{6}$/.test(c.hexColor) ||
      !isOwnBlobUrl(c?.frontImage ?? "") ||
      !isOwnBlobUrl(c?.backImage ?? "")
    ) {
      return { error: "Ungültige Farb-Daten (Name, Farbwert oder Bilder fehlen/fehlerhaft)." };
    }
  }

  const baseSlug = slugify(name) || "produkt";
  let slug = baseSlug;
  let suffix = 1;
  while ((await db.select().from(products).where(eq(products.slug, slug))).length > 0) {
    slug = `${baseSlug}-${++suffix}`;
  }

  const dropLimit = dropLimitRaw && dropLimitRaw !== "" ? parseInt(dropLimitRaw, 10) : null;

  const [created] = await db
    .insert(products)
    .values({
      slug,
      name,
      description,
      priceCents: Math.round(priceEuro * 100),
      compareAtPriceCents: compareAtPriceEuro !== null ? Math.round(compareAtPriceEuro * 100) : null,
      images,
      dropLabel: isSuspiciousInput(dropLabelRaw) ? null : sanitizeText(dropLabelRaw, 40) || null,
      dropLimit: dropLimit && dropLimit > 0 ? dropLimit : null,
      isPreRelease,
      dropDate,
      category,
      gender,
      collection,
    })
    .returning({ id: products.id });

  if (sizes.length > 0) {
    await db.insert(productVariants).values(sizes.map((label) => ({ productId: created.id, label, stock: null })));
  }
  if (parsedColors.length > 0) {
    await db.insert(productColors).values(
      parsedColors.map((c, i) => ({
        productId: created.id,
        name: sanitizeText(c.name, 30),
        hexColor: c.hexColor,
        frontImage: c.frontImage,
        backImage: c.backImage,
        sortOrder: i,
      })),
    );
  }

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
  const isPreRelease = formData.get("isPreRelease") === "true";
  const dropDateRaw = (formData.get("dropDate") as string) ?? "";
  const dropDate = dropDateRaw ? new Date(dropDateRaw) : null;
  if (dropDateRaw && (!dropDate || isNaN(dropDate.getTime()))) {
    return { error: "Ungültiges Drop-Datum." };
  }
  const categoryRaw = (formData.get("category") as string) ?? "";
  const genderRaw = (formData.get("gender") as string) ?? "unisex";
  const collectionRaw = (formData.get("collection") as string) ?? "";
  const category = ["shirt","hoodie","ziphoodie","pants","set"].includes(categoryRaw) ? categoryRaw : null;
  const gender = ["male","female","unisex"].includes(genderRaw) ? genderRaw : "unisex";
  const collection = isSuspiciousInput(collectionRaw) ? null : sanitizeText(collectionRaw, 40) || null;

  if (isSuspiciousInput(nameRaw) || isSuspiciousInput(descriptionRaw)) {
    return { error: "Ungültige Eingabe." };
  }
  if (!priceEuro || priceEuro <= 0) return { error: "Ungültiger Preis." };

  const compareAtPriceEuro = compareAtPriceRaw && compareAtPriceRaw !== "" ? parseFloat(compareAtPriceRaw) : null;
  if (compareAtPriceEuro !== null && (isNaN(compareAtPriceEuro) || compareAtPriceEuro <= priceEuro)) {
    return { error: "Der alte Preis muss höher als der neue Preis sein." };
  }

  const dropLimit = dropLimitRaw && dropLimitRaw !== "" ? parseInt(dropLimitRaw, 10) : null;

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
      isPreRelease,
      dropDate,
      category,
      gender,
      collection,
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
  const colors = await db.select().from(productColors).where(eq(productColors.productId, id));

  await db.delete(productVariants).where(eq(productVariants.productId, id));
  await db.delete(productColors).where(eq(productColors.productId, id));
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
  for (const c of colors) {
    for (const url of [c.frontImage, c.backImage]) {
      try {
        await del(url);
      } catch (e) {
        console.error("Konnte Farb-Blob nicht löschen:", url, e);
      }
    }
  }

  return { success: true };
}

export async function addColor(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const productId = Number(formData.get("productId"));
  const nameRaw = (formData.get("name") as string) ?? "";
  const hexColor = (formData.get("hexColor") as string) ?? "";
  const frontImage = (formData.get("frontImage") as string) ?? "";
  const backImage = (formData.get("backImage") as string) ?? "";

  if (!productId || isSuspiciousInput(nameRaw)) return { error: "Ungültige Eingabe." };
  const name = sanitizeText(nameRaw, 30);
  if (!name) return { error: "Name erforderlich." };
  if (!/^#[0-9a-fA-F]{6}$/.test(hexColor)) return { error: "Ungültiger Farbwert." };
  if (!isOwnBlobUrl(frontImage) || !isOwnBlobUrl(backImage)) {
    return { error: "Vorder- und Rückseiten-Bild sind erforderlich." };
  }

  const existingCount = await db.select().from(productColors).where(eq(productColors.productId, productId));

  await db.insert(productColors).values({
    productId,
    name,
    hexColor,
    frontImage,
    backImage,
    sortOrder: existingCount.length,
  });

  return { success: true };
}

export async function updateColorImages(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Ungültig." };
  const frontImage = (formData.get("frontImage") as string) ?? "";
  const backImage = (formData.get("backImage") as string) ?? "";

  const existing = await db.select().from(productColors).where(eq(productColors.id, id));
  if (existing.length === 0) return { error: "Farbe nicht gefunden." };

  const updates: { frontImage?: string; backImage?: string } = {};
  if (frontImage) {
    if (!isOwnBlobUrl(frontImage)) return { error: "Ungültiges Bild." };
    updates.frontImage = frontImage;
  }
  if (backImage) {
    if (!isOwnBlobUrl(backImage)) return { error: "Ungültiges Bild." };
    updates.backImage = backImage;
  }
  if (Object.keys(updates).length === 0) return { error: "Kein neues Bild ausgewählt." };

  await db.update(productColors).set(updates).where(eq(productColors.id, id));

  // Alte Blobs aufräumen, nachdem sie durch die neuen ersetzt wurden.
  const oldUrls = [
    frontImage && existing[0].frontImage !== frontImage ? existing[0].frontImage : null,
    backImage && existing[0].backImage !== backImage ? existing[0].backImage : null,
  ].filter(Boolean) as string[];
  for (const url of oldUrls) {
    try {
      await del(url);
    } catch (e) {
      console.error("Konnte altes Farb-Blob nicht löschen:", url, e);
    }
  }

  return { success: true };
}

export async function deleteColor(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Ungültig." };

  const existing = await db.select().from(productColors).where(eq(productColors.id, id));
  await db.delete(productColors).where(eq(productColors.id, id));

  for (const url of [existing[0]?.frontImage, existing[0]?.backImage]) {
    if (!url) continue;
    try {
      await del(url);
    } catch (e) {
      console.error("Konnte Farb-Blob nicht löschen:", url, e);
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
// Diagnose: ist Vercel Blob (Bilder-Upload) wirklich verbunden?
// ===================================================================
// ===================================================================
// Pre-Release-Zugangscodes
// ===================================================================
export async function createPreReleaseCode(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const codeRaw = ((formData.get("code") as string) ?? "").trim().toUpperCase();
  const maxUsesRaw = (formData.get("maxUsesPerAccount") as string) ?? "1";
  const maxUsesPerAccount = parseInt(maxUsesRaw, 10);

  if (!codeRaw || codeRaw.length < 3 || codeRaw.length > 30) {
    return { error: "Bitte einen Code zwischen 3 und 30 Zeichen angeben." };
  }
  if (isSuspiciousInput(codeRaw)) return { error: "Ungültiger Code." };
  if (!maxUsesPerAccount || maxUsesPerAccount <= 0) {
    return { error: "Ungültige Anzahl (mindestens 1)." };
  }

  try {
    await db.insert(preReleaseCodes).values({ code: codeRaw, maxUsesPerAccount });
  } catch {
    return { error: "Dieser Code existiert schon." };
  }

  return { success: true };
}

export async function deletePreReleaseCode(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Ungültig." };
  await db.delete(preReleaseRedemptions).where(eq(preReleaseRedemptions.codeId, id));
  await db.delete(preReleaseCodes).where(eq(preReleaseCodes.id, id));
  return { success: true };
}

export async function checkBlobConnection() {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      success: false,
      message: "BLOB_READ_WRITE_TOKEN ist nicht gesetzt. Im Vercel Dashboard unter Storage einen Blob-Store erstellen und mit diesem Projekt verbinden, dann neu deployen.",
    };
  }

  try {
    // Echter Verbindungstest statt nur die Existenz der Env-Variable zu
    // prüfen - falls der Token falsch/abgelaufen ist, würde list() das
    // genauso aufdecken.
    await list({ limit: 1 });
    return { success: true, message: "Verbindung zu Vercel Blob funktioniert." };
  } catch (e) {
    console.error("Blob-Verbindungstest fehlgeschlagen:", e);
    const detail = e instanceof Error ? e.message : String(e);
    return { success: false, message: `Verbindung fehlgeschlagen: ${detail}` };
  }
}

// ===================================================================
// Admin-Suche: User per aktuellem ODER früherem Benutzernamen finden
// ===================================================================
export async function setUserRole(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const userId = Number(formData.get("userId"));
  const roleRaw = (formData.get("role") as string) ?? "";
  if (!userId) return { error: "Ungültig." };

  const role = roleRaw.trim() === "" ? null : roleRaw;
  if (role !== null && !isValidRole(role)) return { error: "Ungültige Rolle." };

  // Sicherheitsnetz: der letzte verbleibende Admin darf sich nicht selbst
  // die Admin-Rolle entziehen, sonst kann sich niemand mehr um Rollen
  // kümmern.
  if (role !== "admin") {
    const currentAdmins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
    if (currentAdmins.length === 1 && currentAdmins[0].id === userId) {
      return { error: "Das ist der letzte Admin-Account - Rolle kann nicht entfernt werden." };
    }
  }

  await db.update(users).set({ role, isAdmin: role === "admin" }).where(eq(users.id, userId));
  return { success: true };
}

export async function searchUserByUsername(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const raw = ((formData.get("username") as string) ?? "").trim();
  if (!raw) return { error: "Bitte Email oder Benutzernamen eingeben." };
  if (isSuspiciousInput(raw)) return { error: "Ungültige Eingabe." };

  // Reihenfolge: 1) exakte/aktuelle Email  2) aktueller Username
  // 3) früherer Username (Historie) - alle case-insensitive.
  let userId: number | null = null;

  const emailMatch = await db.select().from(users).where(ilike(users.email, raw));
  userId = emailMatch[0]?.id ?? null;

  if (!userId) {
    const directMatch = await db.select().from(users).where(ilike(users.username, raw));
    userId = directMatch[0]?.id ?? null;
  }

  if (!userId) {
    const historyMatch = await db
      .select()
      .from(usernameHistory)
      .where(ilike(usernameHistory.username, raw))
      .orderBy(desc(usernameHistory.changedAt))
      .limit(1);
    userId = historyMatch[0]?.userId ?? null;
  }

  if (!userId) return { error: "Kein User mit dieser Email oder diesem (auch früheren) Benutzernamen gefunden." };

  const found = await db.select().from(users).where(eq(users.id, userId));
  if (found.length === 0) return { error: "User nicht gefunden." };
  const user = found[0];

  const history = await db
    .select()
    .from(usernameHistory)
    .where(eq(usernameHistory.userId, userId))
    .orderBy(desc(usernameHistory.changedAt));

  return {
    success: true,
    user: {
      id: user.id,
      memberNo: user.memberNo,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      role: user.role,
      chatAccess: user.chatAccess,
      points: user.points,
      orderCount: user.orderCount,
      discountPercent: user.discountPercent,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      mustSetPassword: user.mustSetPassword,
    },
    history: history.map((h) => ({ username: h.username, changedAt: h.changedAt })),
  };
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
  const admin = await requireRole("news-channel");
  if (!admin) return { error: "Keine Berechtigung." };

  const titleRaw = (formData.get("title") as string) ?? "";
  const bodyRaw = (formData.get("body") as string) ?? "";
  const bodyHtmlRaw = (formData.get("bodyHtml") as string) ?? "";
  const attachmentsRaw = (formData.get("attachments") as string) ?? "[]";
  if (isSuspiciousInput(titleRaw) || isSuspiciousInput(bodyRaw)) {
    return { error: "Ungültige Eingabe." };
  }
  const title = sanitizeText(titleRaw, 100);
  const body = sanitizeText(bodyRaw, 2000);
  if (!title || !body) return { error: "Titel und Text erforderlich." };
  const bodyHtml = bodyHtmlRaw.trim() ? sanitizeHtml(bodyHtmlRaw, 20000) : null;
  let attachments: { url: string; name: string }[] = [];
  try {
    const parsed = JSON.parse(attachmentsRaw);
    if (Array.isArray(parsed)) {
      attachments = parsed
        .filter((a) => a && typeof a.url === "string" && typeof a.name === "string")
        .slice(0, 10)
        .map((a) => ({ url: sanitizeText(a.url, 500), name: sanitizeText(a.name, 200) }));
    }
  } catch { /* Anhänge sind optional, Fehler ignorieren */ }

  const [post] = await db.insert(newsPosts).values({ title, body, bodyHtml, attachments }).returning({ id: newsPosts.id });

  const pushResult = await sendPushToAll({ title, body, url: "/shop" });
  if (!("error" in pushResult)) {
    await db.update(newsPosts).set({ pushSentAt: new Date() }).where(eq(newsPosts.id, post.id));
  }

  const emailResult = await sendNewsletterEmailToAll(title, body, bodyHtml, attachments);
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

export async function updateNewsPost(formData: FormData) {
  const admin = await requireRole("news-channel");
  if (!admin || !canEditPosts(admin.resolvedRole)) return { error: "Keine Berechtigung." };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Ungültig." };
  const titleRaw = (formData.get("title") as string) ?? "";
  const bodyRaw = (formData.get("body") as string) ?? "";
  const bodyHtmlRaw = (formData.get("bodyHtml") as string) ?? "";
  const attachmentsRaw = (formData.get("attachments") as string) ?? "[]";

  if (isSuspiciousInput(titleRaw) || isSuspiciousInput(bodyRaw)) return { error: "Ungültige Eingabe." };
  const title = sanitizeText(titleRaw, 100);
  const body = sanitizeText(bodyRaw, 2000);
  if (!title || !body) return { error: "Titel und Text erforderlich." };
  const bodyHtml = bodyHtmlRaw.trim() ? sanitizeHtml(bodyHtmlRaw, 20000) : null;
  let attachments: { url: string; name: string }[] = [];
  try {
    const parsed = JSON.parse(attachmentsRaw);
    if (Array.isArray(parsed)) {
      attachments = parsed
        .filter((a) => a && typeof a.url === "string" && typeof a.name === "string")
        .slice(0, 10)
        .map((a) => ({ url: sanitizeText(a.url, 500), name: sanitizeText(a.name, 200) }));
    }
  } catch { /* Anhänge sind optional, Fehler ignorieren */ }

  // Bearbeiten korrigiert nur den gespeicherten Datensatz - schickt NICHT
  // erneut Push/Mail raus, das ist schon einmal beim Anlegen passiert.
  await db.update(newsPosts).set({ title, body, bodyHtml, attachments }).where(eq(newsPosts.id, id));
  return { success: true };
}

export async function deleteNewsPost(formData: FormData) {
  const admin = await requireRole("news-channel");
  if (!admin || !canEditPosts(admin.resolvedRole)) return { error: "Keine Berechtigung." };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Ungültig." };
  await db.delete(newsPosts).where(eq(newsPosts.id, id));
  return { success: true };
}

// ===================================================================
// Startseiten-Blog-Posts
// ===================================================================
export async function createHomePost(formData: FormData) {
  const admin = await requireRole("home-posts");
  if (!admin) return { error: "Keine Berechtigung." };

  const titleRaw = (formData.get("title") as string) ?? "";
  const bodyRaw = (formData.get("body") as string) ?? "";
  const bodyHtmlRaw = (formData.get("bodyHtml") as string) ?? "";
  const attachmentsRaw = (formData.get("attachments") as string) ?? "[]";
  const imageUrl = (formData.get("imageUrl") as string) ?? "";
  const videoUrl = (formData.get("videoUrl") as string) ?? "";
  const categoryRaw = (formData.get("category") as string) ?? "article";
  const scheduledForRaw = (formData.get("scheduledFor") as string) ?? "";
  const scheduledFor = scheduledForRaw && new Date(scheduledForRaw) > new Date() ? new Date(scheduledForRaw) : null;

  if (isSuspiciousInput(titleRaw) || isSuspiciousInput(bodyRaw)) return { error: "Ungültige Eingabe." };
  const title = sanitizeText(titleRaw, 120);
  if (!title) return { error: "Titel erforderlich." };
  const bodyHtml = bodyHtmlRaw.trim() ? sanitizeHtml(bodyHtmlRaw, 20000) : null;
  let attachments: { url: string; name: string }[] = [];
  try {
    const parsed = JSON.parse(attachmentsRaw);
    if (Array.isArray(parsed)) {
      attachments = parsed
        .filter((a) => a && typeof a.url === "string" && typeof a.name === "string")
        .slice(0, 10)
        .map((a) => ({ url: sanitizeText(a.url, 500), name: sanitizeText(a.name, 200) }));
    }
  } catch { /* Anhänge sind optional, Fehler ignorieren */ }

  await db.insert(homePosts).values({
    title,
    body: sanitizeText(bodyRaw, 5000) || null,
    bodyHtml,
    attachments,
    imageUrl: imageUrl || null,
    videoUrl: videoUrl || null,
    category: ["article", "video", "leak", "makingof"].includes(categoryRaw) ? categoryRaw : "article",
    published: false,
    scheduledFor,
  });

  return { success: true };
}

export async function updateHomePost(formData: FormData) {
  const admin = await requireRole("home-posts");
  if (!admin || !canEditPosts(admin.resolvedRole)) return { error: "Keine Berechtigung." };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Ungültig." };

  const titleRaw = (formData.get("title") as string) ?? "";
  const bodyRaw = (formData.get("body") as string) ?? "";
  const bodyHtmlRaw = (formData.get("bodyHtml") as string) ?? "";
  const attachmentsRaw = (formData.get("attachments") as string) ?? "[]";
  const imageUrl = (formData.get("imageUrl") as string) ?? "";
  const videoUrl = (formData.get("videoUrl") as string) ?? "";
  const categoryRaw = (formData.get("category") as string) ?? "article";
  const scheduledForRaw = (formData.get("scheduledFor") as string) ?? "";
  const scheduledFor = scheduledForRaw && new Date(scheduledForRaw) > new Date() ? new Date(scheduledForRaw) : null;

  if (isSuspiciousInput(titleRaw) || isSuspiciousInput(bodyRaw)) return { error: "Ungültige Eingabe." };
  const title = sanitizeText(titleRaw, 120);
  if (!title) return { error: "Titel erforderlich." };
  const bodyHtml = bodyHtmlRaw.trim() ? sanitizeHtml(bodyHtmlRaw, 20000) : null;
  let attachments: { url: string; name: string }[] = [];
  try {
    const parsed = JSON.parse(attachmentsRaw);
    if (Array.isArray(parsed)) {
      attachments = parsed
        .filter((a) => a && typeof a.url === "string" && typeof a.name === "string")
        .slice(0, 10)
        .map((a) => ({ url: sanitizeText(a.url, 500), name: sanitizeText(a.name, 200) }));
    }
  } catch { /* Anhänge sind optional, Fehler ignorieren */ }

  await db.update(homePosts).set({
    title,
    body: sanitizeText(bodyRaw, 5000) || null,
    bodyHtml,
    attachments,
    imageUrl: imageUrl || null,
    videoUrl: videoUrl || null,
    category: ["article", "video", "leak", "makingof"].includes(categoryRaw) ? categoryRaw : "article",
    scheduledFor,
    updatedAt: new Date(),
  }).where(eq(homePosts.id, id));

  return { success: true };
}

export async function toggleHomePostPublished(formData: FormData) {
  const admin = await requireRole("home-posts");
  if (!admin) return { error: "Keine Berechtigung." };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Ungültig." };

  const existing = await db.select().from(homePosts).where(eq(homePosts.id, id));
  if (existing.length === 0) return { error: "Post nicht gefunden." };

  await db.update(homePosts).set({ published: !existing[0].published }).where(eq(homePosts.id, id));
  return { success: true };
}

export async function deleteHomePost(formData: FormData) {
  const admin = await requireRole("home-posts");
  if (!admin || !canEditPosts(admin.resolvedRole)) return { error: "Keine Berechtigung." };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Ungültig." };
  await db.delete(homePosts).where(eq(homePosts.id, id));
  return { success: true };
}

// ===================================================================
// Team-Chat: Zugriffssteuerung (Rollen-Standard + Per-User-Override)
// ===================================================================

export async function saveChatRoleAccess(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const next: ChatRoleAccess = {
    admin: formData.get("admin") === "true",
    developer: formData.get("developer") === "true",
    marketing: formData.get("marketing") === "true",
  };
  await setSetting(CHAT_ROLE_ACCESS_KEY, next);
  return { success: true };
}

export async function setUserChatAccess(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Keine Berechtigung." };

  const userId = Number(formData.get("userId"));
  const value = (formData.get("value") as string) ?? "inherit"; // "true" | "false" | "inherit"
  if (!userId) return { error: "Ungültig." };

  const chatAccess = value === "true" ? true : value === "false" ? false : null;
  await db.update(users).set({ chatAccess }).where(eq(users.id, userId));
  return { success: true };
}
