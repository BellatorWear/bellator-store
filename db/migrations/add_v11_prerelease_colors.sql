-- ===================================================================
-- v11: Farbe im Warenkorb, Pre-Release-Produkte + Zugangscodes
-- ===================================================================

ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS color_id INTEGER REFERENCES product_colors(id);

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_pre_release BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS drop_date TIMESTAMP;

CREATE TABLE IF NOT EXISTS pre_release_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  max_uses_per_account INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pre_release_redemptions (
  id SERIAL PRIMARY KEY,
  code_id INTEGER NOT NULL REFERENCES pre_release_codes(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  redeemed_at TIMESTAMP DEFAULT NOW()
);
