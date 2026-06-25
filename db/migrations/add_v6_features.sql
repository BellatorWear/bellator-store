-- Push- und Newsletter-Status dauerhaft am User speichern
-- (vorher gab es dafür keine Spalte, der Push-Toggle ist deshalb nach
-- jedem Neuladen wieder zurückgesprungen)
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_opt_in BOOLEAN DEFAULT FALSE;

-- Prämien, die man sich mit Punkten holen kann (kein echtes Geld)
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cost_points INTEGER NOT NULL,
  type TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS user_rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  reward_id INTEGER REFERENCES rewards(id),
  code TEXT,
  redeemed_at TIMESTAMP DEFAULT NOW()
);

-- Neue Challenges
INSERT INTO challenges (title, description, point_reward, type)
SELECT * FROM (VALUES
  ('Discord beitreten', 'Tritt unserem Discord Server bei und werde Teil der Community.', 50, 'discord_join'),
  ('Newsletter abonnieren', 'Abonniere unseren Newsletter und verpasse keinen Drop.', 30, 'newsletter'),
  ('Push-Benachrichtigungen aktivieren', 'Aktiviere Push-Benachrichtigungen in den Einstellungen.', 30, 'push'),
  ('Bewertung hinterlassen', 'Hinterlasse uns eine Bewertung (z.B. auf Google oder Trustpilot).', 75, 'review'),
  ('Freund einladen', 'Lade einen Freund ein, der sich registriert.', 100, 'referral'),
  ('Licht entdeckt', 'Probiere den Light Mode in den Einstellungen aus.', 10, 'theme_explorer')
) AS new_challenges(title, description, point_reward, type)
WHERE NOT EXISTS (
  SELECT 1 FROM challenges WHERE challenges.title = new_challenges.title
);

-- Prämien-Katalog (Punkte einlösen, kein echtes Geld)
INSERT INTO rewards (title, description, cost_points, type)
SELECT * FROM (VALUES
  ('5% Rabatt-Code', 'Schalte 5% zusätzlichen Rabatt auf deine nächsten Bestellungen frei.', 150, 'discount'),
  ('Bellator Sticker-Pack', 'Ein exklusives Sticker-Pack, das wir dir per Post zuschicken.', 80, 'physical'),
  ('Profil-Badge: Bellator Insider', 'Ein cooles Abzeichen für dein Profil.', 50, 'badge')
) AS new_rewards(title, description, cost_points, type)
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE rewards.title = new_rewards.title
);
