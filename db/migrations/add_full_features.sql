-- Neue Spalten in users
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';

-- Bestellungen
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  guest_email TEXT,
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  receipt_data TEXT
);

-- Bestellpositionen
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- Punkte-Transaktionen
CREATE TABLE IF NOT EXISTS point_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  point_reward INTEGER NOT NULL,
  type TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- User-Challenges
CREATE TABLE IF NOT EXISTS user_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  challenge_id INTEGER REFERENCES challenges(id),
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Standard-Challenges
INSERT INTO challenges (title, description, point_reward, type) VALUES
  ('Erster Kauf', 'Schließe deine erste Bestellung ab.', 100, 'first_order'),
  ('Treuer Kunde', 'Bestelle zum dritten Mal.', 150, 'repeat_customer'),
  ('Profil vervollständigen', 'Bestätige deine Email und setze ein Passwort.', 50, 'complete_profile'),
  ('Early Adopter', 'Registriere dich in den ersten 100 Mitgliedern.', 200, 'early_adopter')
ON CONFLICT DO NOTHING;
