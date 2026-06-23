-- Admin-Rechte und Rabatt in users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_subscription TEXT;

-- Stock und Sold Out in products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_out BOOLEAN DEFAULT FALSE;

-- Newsletter-Tabelle
CREATE TABLE IF NOT EXISTS newsletter (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

-- Rabatt in orders speichern
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_applied INTEGER DEFAULT 0;

-- Admin setzen (ersetze die Email durch deine echte)
-- UPDATE users SET is_admin = TRUE WHERE email = 'deine@email.com';
