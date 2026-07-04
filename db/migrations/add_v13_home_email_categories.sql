-- ===================================================================
-- v13: Startseite/Blog, Email-Log, Shop-Kategorien, Punkte für Käufe,
--      Warenkorb-Timer-Verbesserungen, neue Challenges+Rewards
-- ===================================================================

-- Startseiten-Blog-Posts
CREATE TABLE IF NOT EXISTS home_posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  video_url TEXT,
  category TEXT NOT NULL DEFAULT 'article',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email-Log
CREATE TABLE IF NOT EXISTS email_log (
  id SERIAL PRIMARY KEY,
  "to" TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  source TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Produkt-Kategorien
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS collection TEXT;

-- Challenge: Top Käufer
INSERT INTO challenges (title, description, point_reward, type)
VALUES ('Top Käufer', 'Erreiche 10 abgeschlossene Bestellungen.', 1000, 'order_10')
ON CONFLICT (title) DO NOTHING;

-- Reward-Preise anpassen
UPDATE rewards SET cost_points = 250 WHERE title = '5% Rabatt-Code';
UPDATE rewards SET cost_points = 500 WHERE title = '10% Rabatt-Code';
UPDATE rewards SET cost_points = 1000 WHERE title = '15% Rabatt-Code';
UPDATE rewards SET cost_points = 1500 WHERE title = '20% Rabatt-Code';
UPDATE rewards SET cost_points = 300 WHERE title = 'Früher Zugang';
UPDATE rewards SET cost_points = 100 WHERE title = 'Profil-Badge: Bellator Insider';
