import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

// Benutzer-Tabelle
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // NULL bis Passwort gesetzt wird
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  mustSetPassword: boolean("must_set_password").default(true),
});

// Email-Verifizierungstoken (Magic Link)
export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Access Keys (jetzt an User gebunden)
export const accessKeys = pgTable("access_keys", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  isUsed: boolean("is_used").default(false),
  email: text("email"),
  expiresAt: timestamp("expires_at"), // Key verfällt nach einiger Zeit (Schutz vor altem, geleaktem Key)
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
