import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
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
  role: text("role"), // null = normaler User, sonst 'admin' | 'developer' | 'marketing'
  orderCount: integer("order_count").default(0),
  discountPercent: integer("discount_percent").default(0), // Rabatt in % (berechnet)
  pushSubscription: text("push_subscription"), // JSON Web Push subscription
  pushEnabled: boolean("push_enabled").default(false),
  newsletterOptIn: boolean("newsletter_opt_in").default(false),
  username: text("username").unique(),
  usernameChangedAt: timestamp("username_changed_at"),
  // Team-Chat-Zugriff: null = vom Rollen-Standard erben (siehe siteSettings
  // Key "chat_role_access"), true/false = expliziter Override durch einen
  // Admin (z.B. einem einzelnen Marketing-User Zugriff geben/entziehen,
  // ohne gleich die ganze Rolle umzustellen).
  chatAccess: boolean("chat_access"),
  // Team-Attribut: bei Rollenzuteilung anklickbar, sorgt für automatische
  // Mitgliedschaft im globalen Team-Channel (siehe app/chat/team.ts).
  isTeam: boolean("is_team").default(false),
  // Session-Invalidierung (v27): wird bei Passwortänderung und beim
  // Sperren/Löschen hochgezählt. Ein Session-Token mit altem Wert wird
  // sofort ungültig, egal wie lange sein Ablaufdatum noch läuft.
  sessionVersion: integer("session_version").notNull().default(0),
  // Löschanfrage (v27): 7-Tage-Frist bis zur tatsächlichen Löschung/
  // Anonymisierung. Solange gesetzt und in der Zukunft, ist der Account
  // gesperrt (kein Login möglich). Admin kann bei Einwand abbrechen.
  pendingDeletionAt: timestamp("pending_deletion_at"),
  // Zeitpunkt der tatsächlichen Anonymisierung (durch den Cron-Sweep
  // gesetzt), damit ein bereits anonymisierter Account nicht nochmal
  // angefasst wird.
  anonymizedAt: timestamp("anonymized_at"),
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
  // Kategorisierung für Shop-Filter
  category: text("category"), // "shirt"|"hoodie"|"ziphoodie"|"pants"|"set"
  gender: text("gender"), // "male"|"female"|"unisex"
  collection: text("collection"), // frei wählbarer Name, z.B. "Summer 2025"
  // Pre-Release: vor dropDate nur für User mit Pre-Release-Zugang sichtbar.
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
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
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
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
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
  codeId: integer("code_id")
    .notNull()
    .references(() => preReleaseCodes.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
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
  bodyHtml: text("body_html"),
  attachments: jsonb("attachments")
    .$type<{ url: string; name: string }[]>()
    .default([]),
  createdAt: timestamp("created_at").defaultNow(),
  pushSentAt: timestamp("push_sent_at"),
  emailSentAt: timestamp("email_sent_at"),
});

// ===================================================================
// Neue Tabellen (v13)
// ===================================================================

// Startseiten-Posts (Blog-artig) - Admin kann Artikel, Bilder,
// Videos und Leaks posten. category = "article"|"video"|"leak"|"makingof"
export const homePosts = pgTable("home_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body"),
  bodyHtml: text("body_html"),
  attachments: jsonb("attachments")
    .$type<{ url: string; name: string }[]>()
    .default([]),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  category: text("category").notNull().default("article"),
  published: boolean("published").default(false),
  scheduledFor: timestamp("scheduled_for"), // wenn gesetzt: automatisch veröffentlichen, sobald erreicht
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email-Log: Jede versendete Mail landet hier (automatische und manuelle).
export const emailLog = pgTable("email_log", {
  id: serial("id").primaryKey(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  source: text("source").notNull(), // "newsletter"|"reward"|"verification"|"news"|"reminder"
  sentAt: timestamp("sent_at").defaultNow(),
});

// ===================================================================
// Neue Tabellen (v18) - Interner Team-Chat
// ===================================================================

// Ein "Channel" ist entweder ein benannter Gruppen-Channel (type="channel",
// name gesetzt) oder eine Direktnachricht zwischen genau 2 Usern
// (type="dm", name=null - der Anzeigename wird clientseitig aus dem
// jeweils anderen Mitglied berechnet).
export const chatChannels = pgTable("chat_channels", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("channel"), // "channel" | "dm"
  name: text("name"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatChannelMembers = pgTable("chat_channel_members", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id")
    .notNull()
    .references(() => chatChannels.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  lastReadAt: timestamp("last_read_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id")
    .notNull()
    .references(() => chatChannels.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  // Optionaler Datei-/Bild-Anhang - body darf dann leer sein (siehe
  // sendMessage-Validierung: body ODER Anhang muss gesetzt sein).
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  attachmentType: text("attachment_type"),
  // Antwort auf eine andere Nachricht im selben Channel (optional).
  replyToId: integer("reply_to_id"),
  // Weitergeleitet von X - denormalisierter Username zum Zeitpunkt der
  // Weiterleitung, kein FK, weil das Ziel ein anderer Channel ist, auf den
  // der ursprüngliche Autor evtl. keinen Zugriff hat.
  forwardedFromUsername: text("forwarded_from_username"),
  // Zeitstempel der letzten Bearbeitung (v24) - null = nie bearbeitet.
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================================================================
// Dynamische Rollen (v22) - Admin kann eigene Rollen mit frei wählbaren
// Adminpanel-Bereichen anlegen, statt der 3 fest einprogrammierten
// (admin/developer/marketing bleiben als Startbelegung erhalten).
// ===================================================================
export const customRoles = pgTable("custom_roles", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(), // interner Key, in users.role gespeichert
  label: text("label").notNull(), // Anzeigename
  color: text("color").notNull().default("#a855f7"),
  sections: jsonb("sections").notNull().default([]), // AdminSectionId[]
  canEditPosts: boolean("can_edit_posts").notNull().default(false),
  // Granulare Admin-Berechtigungen (v23), unabhängig von vollem isAdmin.
  canManageDiscountCodes: boolean("can_manage_discount_codes")
    .notNull()
    .default(false),
  canAssignRoles: boolean("can_assign_roles").notNull().default(false),
  // Reserviert, bis es eine tatsächliche User-Löschfunktion gibt.
  canDeleteUsers: boolean("can_delete_users").notNull().default(false),
  // Team-Chat-Rechte (v23).
  chatCanCreateChannels: boolean("chat_can_create_channels")
    .notNull()
    .default(true),
  chatCanDeleteOthersMessages: boolean("chat_can_delete_others_messages")
    .notNull()
    .default(false),
  chatCanKickMembers: boolean("chat_can_kick_members").notNull().default(false),
  // Rang/Priorität (v23) - höher = mehr Gewicht. Steuert Anzeigereihenfolge
  // und wer wen bei can_assign_roles überschreiben/befördern darf.
  rank: integer("rank").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================================================================
// Support-/Entwicklungs-Tickets (v25)
// ===================================================================
// "Notify Me" bei Ausverkauf - wer benachrichtigt werden will, wenn ein
// Produkt/eine Variante wieder verfügbar ist.
export const restockNotifications = pgTable("restock_notifications", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  notifiedAt: timestamp("notified_at"),
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("support"),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("normal"),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  attachmentType: text("attachment_type"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportTicketMessages = pgTable("support_ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id")
    .notNull()
    .references(() => supportTickets.id),
  userId: integer("user_id").references(() => users.id),
  body: text("body").notNull(),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  attachmentType: text("attachment_type"),
  isInternal: boolean("is_internal").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Produkt-Erweiterungen: Kategorie, Geschlecht, Collection
// (werden als ALTER TABLE in der Migration ergänzt, weil die Tabelle schon existiert)
