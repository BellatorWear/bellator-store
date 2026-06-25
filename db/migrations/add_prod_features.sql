-- Fehlende Spalten in users
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_opt_in BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMP;

-- Warenkorb
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  owner_key TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id),
  variant_id INTEGER,
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cart_items_owner_key_idx ON cart_items(owner_key);
CREATE INDEX IF NOT EXISTS cart_items_added_at_idx ON cart_items(added_at);

-- Produkte (falls noch die alte Schema-Version ohne slug/images)
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_cents INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS drop_label TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS drop_limit INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price_cents_override INTEGER,
  stock INTEGER
);

-- Newsletter
CREATE TABLE IF NOT EXISTS newsletter (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

-- Indexes für Performance bei 100+ Usern
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS access_keys_key_idx ON access_keys(key);
CREATE INDEX IF NOT EXISTS access_keys_user_id_idx ON access_keys(user_id);
CREATE INDEX IF NOT EXISTS email_verifications_token_idx ON email_verifications(token);
CREATE INDEX IF NOT EXISTS point_transactions_user_id_idx ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS user_challenges_user_id_idx ON user_challenges(user_id);
