-- Benutzername (eindeutig, alle 7 Tage änderbar)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMP;

-- Produktkatalog (Admin-verwaltet, mehrere Produkte mit Varianten/Bildern)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  images TEXT[],
  drop_label TEXT,
  drop_limit INTEGER,
  sold_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  label TEXT NOT NULL,
  stock INTEGER,
  price_cents_override INTEGER
);

-- Warenkorb (funktioniert für eingeloggte User UND Gäste über owner_key)
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  owner_key TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  quantity INTEGER DEFAULT 1,
  added_at TIMESTAMP DEFAULT NOW()
);

-- Neue Challenge: "unter den ersten 100 Mitgliedern"
INSERT INTO challenges (title, description, point_reward, type)
SELECT * FROM (VALUES
  ('Einer der Ersten', 'Du gehörst zu den ersten 100 Bellator-Mitgliedern.', 100, 'first_100')
) AS new_challenges(title, description, point_reward, type)
WHERE NOT EXISTS (
  SELECT 1 FROM challenges WHERE challenges.title = new_challenges.title
);
