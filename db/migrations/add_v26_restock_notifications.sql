-- ===================================================================
-- v26: "Notify Me" bei Ausverkauf - Restock-Benachrichtigungen per Email
-- ===================================================================

CREATE TABLE IF NOT EXISTS restock_notifications (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  -- null = Benachrichtigung bezieht sich auf das Produkt allgemein (kein
  -- variantenspezifisches Sold-Out, z.B. Drop-Limit erreicht), sonst die
  -- konkrete Größe/Variante.
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  notified_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS restock_notifications_lookup_idx
  ON restock_notifications (product_id, variant_id, notified_at);
