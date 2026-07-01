-- ===================================================================
-- v12: Seitenbesuche, Challenge-Bereinigung, neue Rewards
-- ===================================================================

CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW()
);

-- --- Challenges bereinigen --------------------------------------------
-- Alle Challenges die man sich selbst geben konnte (discord_join,
-- review, referral) werden deaktiviert - sie sind ein echtes
-- Sicherheitsproblem, weil die Punkte darüber direkt in Rabattcodes
-- umwandelbar sind. Die drei SELF_REPORT_TYPES bleiben im Code noch
-- technisch vorhanden (damit der Server-Check funktioniert), aber keine
-- aktive Challenge hat mehr einen dieser Typen.
UPDATE challenges SET active = false
WHERE type IN ('discord_join', 'review', 'referral', 'early_adopter');

-- Duplikate (aus dem früheren ON CONFLICT DO NOTHING Bug) bereinigen
-- war schon in v9, aber zur Sicherheit nochmal.
DO $$
DECLARE
  dup RECORD;
BEGIN
  FOR dup IN
    SELECT title, MIN(id) AS keep_id, ARRAY_AGG(id) AS all_ids
    FROM challenges
    GROUP BY title
    HAVING COUNT(*) > 1
  LOOP
    UPDATE user_challenges
    SET challenge_id = dup.keep_id
    WHERE challenge_id = ANY(dup.all_ids) AND challenge_id <> dup.keep_id
      AND NOT EXISTS (
        SELECT 1 FROM user_challenges uc2
        WHERE uc2.challenge_id = dup.keep_id AND uc2.user_id = user_challenges.user_id
      );
    DELETE FROM user_challenges
    WHERE challenge_id = ANY(dup.all_ids) AND challenge_id <> dup.keep_id;
    DELETE FROM challenges
    WHERE id = ANY(dup.all_ids) AND id <> dup.keep_id;
  END LOOP;
END $$;

-- Unique-Constraint falls noch nicht gesetzt
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'challenges_title_unique') THEN
    ALTER TABLE challenges ADD CONSTRAINT challenges_title_unique UNIQUE (title);
  END IF;
END $$;

-- Neue automatisch geprüfte Challenges (kein Selbst-Bestätigen)
INSERT INTO challenges (title, description, point_reward, type)
VALUES
  ('5. Bestellung', 'Bestelle zum fünften Mal.', 200, 'order_5'),
  ('10. Bestellung', 'Bestelle zum zehnten Mal — du bist ein echter Bellator-Fan.', 400, 'order_10'),
  ('Push aktiviert', 'Aktiviere Push-Benachrichtigungen.', 30, 'push'),
  ('Newsletter abonniert', 'Melde dich beim Bellator-Newsletter an.', 30, 'newsletter'),
  ('Dark Mode', 'Aktiviere den Dark Mode.', 20, 'theme_explorer'),
  ('Early Adopter', 'Sei unter den ersten 100 Mitgliedern.', 200, 'first_100')
ON CONFLICT (title) DO NOTHING;

-- Rewards: Sticker-Pack entfernen, mehr Rabatt-Optionen hinzufügen
UPDATE rewards SET active = false WHERE title = 'Bellator Sticker-Pack';
UPDATE rewards SET active = false WHERE type = 'physical';

-- Mehr Rewards im Punkteshop
INSERT INTO rewards (title, description, cost_points, type, discount_percent)
SELECT * FROM (VALUES
  ('10% Rabatt-Code', 'Einmaliger 10% Rabatt auf deine nächste Bestellung (90 Tage gültig).', 250, 'discount', 10),
  ('15% Rabatt-Code', 'Einmaliger 15% Rabatt auf deine nächste Bestellung (90 Tage gültig).', 400, 'discount', 15),
  ('20% Rabatt-Code', 'Einmaliger 20% Rabatt auf deine nächste Bestellung (90 Tage gültig).', 600, 'discount', 20),
  ('Früher Zugang', 'Pre-Release-Zugangscode für den nächsten Drop.', 150, 'prerelease_access', 0)
) AS new_rewards(title, description, cost_points, type, discount_percent)
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE rewards.title = new_rewards.title);

-- discount_percent Spalte (falls noch nicht aus v9 vorhanden)
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS discount_percent INTEGER;
UPDATE rewards SET discount_percent = 5 WHERE title = '5% Rabatt-Code' AND discount_percent IS NULL;
