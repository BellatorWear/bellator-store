import {
  pgTable, serial, text, boolean, timestamp, integer
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
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
  images: text("images").array(), // Base64 Data-URLs oder externe URLs
  dropLabel: text("drop_label"), // z.B. "Drop #2" - rein informativ
  dropLimit: integer("drop_limit"), // null = unlimitiert
  soldCount: integer("sold_count").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Varianten (z.B. Größe/Farbe) - optional pro Produkt
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  label: text("label").notNull(), // z.B. "M / Schwarz"
  stock: integer("stock"), // null = unlimitiert
  priceCentsOverride: integer("price_cents_override"),
});

// Warenkorb-Einträge. ownerKey ist entweder "user:<id>" (eingeloggt) oder
// "guest:<uuid>" (Gast-Cookie) - so funktioniert der Warenkorb für beide.
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  ownerKey: text("owner_key").notNull(),
  productId: integer("product_id").references(() => products.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  quantity: integer("quantity").default(1),
  addedAt: timestamp("added_at").defaultNow(),
});
