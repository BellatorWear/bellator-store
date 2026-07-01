import {
  pgTable, serial, text, boolean, timestamp, integer
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // Zweite, eigenständig hochzählende ID (unabhängig von der primären id).
  // Zeigt fortlaufend an, der wievielte registrierte User jemand ist - z.B.
  // für die Admin-Anzeige "X registrierte User" oder "Mitglied #N".
  memberNo: serial("member_no"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  mustSetPassword: boolean("must_set_password").default(true),
  points: integer("points").default(0),
  isGuest: boolean("is_guest").default(false),
  theme: text("theme").default("dark"),
  isAdmin: boolean("is_admin").default(false),
  orderCount: integer("order_count").default(0),
  discountPercent: integer("discount_percent").default(0), // Rabatt in % (berechnet)
  pushSubscription: text("push_subscription"), // JSON Web Push subscription
  pushEnabled: boolean("push_enabled").default(false),
  newsletterOptIn: boolean("newsletter_opt_in").default(false),
  username: text("username").unique(),
  usernameChangedAt: timestamp("username_changed_at"),
});

export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accessKeys = pgTable("access_keys", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  isUsed: boolean("is_used").default(false),
  email: text("email"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accessRequests = pgTable("access_requests", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  requestedAt: timestamp("requested_at").defaultNow(),
  status: text("status").default("pending"),
});

// (Hinweis: hier gab es vorher eine zweite, nie genutzte "products"-Tabelle
// als Platzhalter - wurde entfernt und durch die vollständige Version mit
// Varianten/Bildern/Drop-Limit weiter unten ersetzt, um Namenskollisionen
// zu vermeiden.)

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  guestEmail: text("guest_email"),
  total: integer("total").notNull(),
  discountApplied: integer("discount_applied").default(0), // Rabatt in %
  status: text("status").default("pending"),
  // Stripe Checkout Session ID - verhindert, dass derselbe Webhook-Event
  // (Stripe sendet bei Netzwerkproblemen Retries) die Bestellung doppelt anlegt.
  stripeSessionId: text("stripe_session_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  receiptData: text("receipt_data"),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  pointReward: integer("point_reward").notNull(),
  type: text("type").notNull(),
  active: boolean("active").default(true),
});

export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  challengeId: integer("challenge_id").references(() => challenges.id),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Newsletter / Next-Drop Waitlist
export const newsletter = pgTable("newsletter", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  active: boolean("active").default(true),
});

// Prämien, die man sich mit Punkten holen kann (kein echtes Geld)
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  costPoints: integer("cost_points").notNull(),
  type: text("type").notNull(), // "discount" | "physical" | "badge"
  discountPercent: integer("discount_percent"), // nur relevant bei type="discount"
  active: boolean("active").default(true),
});

// Welche Prämien hat ein User eingelöst
export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  rewardId: integer("reward_id").references(() => rewards.id),
  code: text("code"), // Einlöse-Code für physische Prämien
  redeemedAt: timestamp("redeemed_at").defaultNow(),
});

// Produkte (Admin-verwaltet)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  priceCents: integer("price_cents").notNull(),
  // Wenn gesetzt: der alte/durchgestrichene Preis. priceCents ist dann der
  // reduzierte Preis. null = kein Rabatt, normaler Preis.
  compareAtPriceCents: integer("compare_at_price_cents"),
  images: text("images").array(), // Base64 Data-URLs oder externe URLs
  dropLabel: text("drop_label"), // z.B. "Drop #2" - rein informativ
  dropLimit: integer("drop_limit"), // null = unlimitiert
  soldCount: integer("sold_count").default(0),
  active: boolean("active").default(true),
  // Pre-Release: vor dropDate nur für User mit Pre-Release-Zugang sichtbar.
  // Sobald dropDate erreicht ist, automatisch für alle freigegeben - egal
  // ob isPreRelease oder nicht. Ohne dropDate kein automatisches Verhalten.
  isPreRelease: boolean("is_pre_release").default(false),
  dropDate: timestamp("drop_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Varianten = Größen (z.B. "M", "L") - eigener Lagerbestand pro Größe.
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  label: text("label").notNull(), // z.B. "M"
  stock: integer("stock"), // null = unlimitiert
  priceCentsOverride: integer("price_cents_override"),
});

// Farben eines Produkts - jede Farbe hat einen Swatch (Hex-Wert für den
// Farb-Button) sowie ein Vorder- und Rückseiten-Bild, die beim Auswählen
// der Farbe angezeigt werden.
export const productColors = pgTable("product_colors", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text("name").notNull(), // z.B. "Schwarz"
  hexColor: text("hex_color").notNull(), // z.B. "#000000"
  frontImage: text("front_image").notNull(),
  backImage: text("back_image").notNull(),
  sortOrder: integer("sort_order").default(0),
});

// Warenkorb-Einträge. ownerKey ist entweder "user:<id>" (eingeloggt) oder
// "guest:<uuid>" (Gast-Cookie) - so funktioniert der Warenkorb für beide.
// Speichert JEDEN früheren Benutzernamen eines Users (nicht nur den
// aktuellen) - damit Admins im Suchfeld auch nach alten Namen finden
// können und nachvollziehbar bleibt, wer sich wann wie umbenannt hat.
export const usernameHistory = pgTable("username_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  username: text("username").notNull(),
  changedAt: timestamp("changed_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  ownerKey: text("owner_key").notNull(),
  productId: integer("product_id").references(() => products.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  colorId: integer("color_id").references(() => productColors.id),
  quantity: integer("quantity").default(1),
  addedAt: timestamp("added_at").defaultNow(),
});

// Pre-Release-Zugangscodes: schalten Produkte frei, die noch vor ihrem
// dropDate stehen. maxUsesPerAccount begrenzt, wie oft EIN Account
// denselben Code einlösen kann (Anzahl verschiedener Accounts ist nicht
// begrenzt).
export const preReleaseCodes = pgTable("pre_release_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  maxUsesPerAccount: integer("max_uses_per_account").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const preReleaseRedemptions = pgTable("pre_release_redemptions", {
  id: serial("id").primaryKey(),
  codeId: integer("code_id").notNull().references(() => preReleaseCodes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  redeemedAt: timestamp("redeemed_at").defaultNow(),
});

// Zählt Sitzungsöffnungen (Page Views) — wird clientseitig beim ersten
// Laden des Shops gepingt, einmal pro Session. Kein DSGVO-relevantes
// Tracking (keine Cookies, keine personenbezogenen Daten, nur ein Zähler).
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Einzelne Key/Value Einstellungen, die der Admin im Panel ändert und die
// für ALLE Besucher gelten sollen (z.B. Countdown). Vorher lag sowas in
// localStorage im Browser des Admins - das sah dann für jeden Besucher
// anders aus (bzw. einfach den Default), weil es nie im Server/DB lag.
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON-String
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rabattcodes: sowohl die "ersten N Bestellungen"-Codes (vom Admin
// konfiguriert) als auch die per Punkte-Shop eingelösten Einzel-Codes
// (automatisch über die Stripe API als echte Stripe Promotion Codes
// erzeugt) landen hier, damit wir Übersicht/Limits zentral verwalten.
export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  percentOff: integer("percent_off").notNull(),
  source: text("source").notNull(), // "exclusive_first_orders" | "reward_redemption" | "admin"
  userId: integer("user_id").references(() => users.id), // optional: an bestimmten User gebunden
  stripeCouponId: text("stripe_coupon_id"),
  stripePromotionCodeId: text("stripe_promotion_code_id"),
  maxRedemptions: integer("max_redemptions").default(1),
  timesRedeemed: integer("times_redeemed").default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// News-Channel: Posts, die der Admin veröffentlicht. Werden 1x beim
// Veröffentlichen als Push + Newsletter-Mail an alle Abonnenten verschickt.
export const newsPosts = pgTable("news_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  pushSentAt: timestamp("push_sent_at"),
  emailSentAt: timestamp("email_sent_at"),
});
