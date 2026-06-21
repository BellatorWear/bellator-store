// db/schema.ts

// Alles, was du brauchst, wird hier einmalig importiert:
import { pgTable, serial, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const accessKeys = pgTable('access_keys', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  isUsed: boolean('is_used').default(false),
  email: text('email'),
});

export const accessRequests = pgTable('access_requests', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  requestedAt: timestamp('requested_at').defaultNow(),
  status: text('status').default('pending'),
});

// Neu hinzugefügt:
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(), // Preis in Cent
  imageUrl: text('image_url'),
});