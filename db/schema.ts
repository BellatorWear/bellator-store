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
  theme: text("theme").default("dark"), // "dark" | "light"
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

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
});

// Bestellungen
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  guestEmail: text("guest_email"), // für Gäste
  total: integer("total").notNull(), // in Cent
  status: text("status").default("pending"), // pending | paid | shipped | delivered
  createdAt: timestamp("created_at").defaultNow(),
  receiptData: text("receipt_data"), // JSON-String mit Bestelldetails
});

// Bestellpositionen
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

// Punkte-Transaktionen (Audit Trail)
export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  points: integer("points").notNull(), // positiv = gewonnen, negativ = eingelöst
  reason: text("reason").notNull(), // z.B. "Bestellung #12", "Challenge: Erster Kauf"
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenges
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  pointReward: integer("point_reward").notNull(),
  type: text("type").notNull(), // "first_order" | "repeat_customer" | "share" | "review" etc.
  active: boolean("active").default(true),
});

// Welche Challenges hat ein User abgeschlossen
export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  challengeId: integer("challenge_id").references(() => challenges.id),
  completedAt: timestamp("completed_at").defaultNow(),
});
