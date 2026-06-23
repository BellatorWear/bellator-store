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
  stock: integer("stock").default(10), // Limited to 10
  soldOut: boolean("sold_out").default(false),
});

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
