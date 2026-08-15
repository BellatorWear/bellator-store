-- ===================================================================
-- v36: Performance-Indexes
-- ===================================================================
-- Hintergrund: Postgres legt automatisch nur für PRIMARY KEY und
-- UNIQUE-Constraints einen Index an - NICHT für normale Foreign Keys.
-- Die folgenden Spalten werden auf stark frequentierten Pfaden (Produkt-
-- seite, Warenkorb, Chat, Bestellhistorie) bei jedem Request gefiltert,
-- hatten bisher aber gar keinen Index -> Postgres macht dort einen vollen
-- Tabellen-Scan statt eines Index-Lookups. Bei wachsender Datenmenge wird
-- das zunehmend zum Flaschenhals.

-- Produktseite: Reviews pro Produkt (jeder Produktseiten-Aufruf)
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);

-- Warenkorb: Cart-Items pro Owner (jeder Warenkorb-Request, Cookie-basiert)
CREATE INDEX IF NOT EXISTS idx_cart_items_owner_key ON cart_items(owner_key);

-- Bestellhistorie / Profil
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Shop-Listing / Sitemap: Filter auf aktive Produkte
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- Team-Chat: Nachrichten pro Channel (Polling/Realtime, sehr hohe Frequenz)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_channel_members_channel_id ON chat_channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_channel_members_user_id ON chat_channel_members(user_id);

-- Restock-Benachrichtigungen: Lookup pro Produkt beim Wiederverfügbar-Cron
CREATE INDEX IF NOT EXISTS idx_restock_notifications_product_id ON restock_notifications(product_id);

-- Support-Tickets: eigene Tickets im Profil
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
