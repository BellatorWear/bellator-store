-- ===================================================================
-- v9: Bugfixes + neue Features (Rabatte, Member-Nr., Settings, News)
-- ===================================================================

-- --- Dynamische, eigenständig hochzählende Member-Nummer -----------
-- Eigene SERIAL-Spalte (unabhängig von "id"), damit man immer sehen kann
-- "der wievielte registrierte User" jemand war, ohne die echte id zu
-- exponieren/zu verändern.
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_no SERIAL;

-- --- BUGFIX: must_set_password / is_admin konnten NULL sein -----------
-- In der echten DB hatten "must_set_password" und "is_admin" KEINE
-- NOT NULL Constraint. Der App-Code hat überall "user.mustSetPassword ?? false"
-- benutzt - bei einem NULL-Wert (statt explizit true/false) wurde das als
-- "kein Passwort nötig" interpretiert. Ergebnis: User mit NULL in dieser
-- Spalte wurden NIE zum Passwort-Setzen aufgefordert, obwohl sie noch gar
-- keins hatten. SET NOT NULL würde fehlschlagen solange NULL-Zeilen
-- existieren, deshalb zuerst auffüllen:
-- Auffüllen: nur auf "true" setzen, wenn wirklich noch kein Passwort
-- existiert - sonst würden bereits aktive User mit echtem Passwort (aber
-- zufällig NULL in dieser Spalte) unnötig nochmal zum Setzen gezwungen.
UPDATE users SET must_set_password = (password_hash IS NULL) WHERE must_set_password IS NULL;
UPDATE users SET is_admin = false WHERE is_admin IS NULL;

ALTER TABLE users ALTER COLUMN must_set_password SET DEFAULT true;
ALTER TABLE users ALTER COLUMN must_set_password SET NOT NULL;
ALTER TABLE users ALTER COLUMN is_admin SET DEFAULT false;
ALTER TABLE users ALTER COLUMN is_admin SET NOT NULL;

-- --- Rabatte an Produkten --------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price_cents INTEGER;

-- --- Punkte-Prämien: konkreter Rabatt-Prozentsatz statt nur Text -----
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS discount_percent INTEGER;
UPDATE rewards SET discount_percent = 5 WHERE title = '5% Rabatt-Code' AND discount_percent IS NULL;

-- --- Stripe Session ID an Bestellungen (Webhook-Idempotenz) ----------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_stripe_session_id_unique'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_stripe_session_id_unique UNIQUE (stripe_session_id);
  END IF;
END $$;

-- --- Globale Server-Settings (z.B. Countdown) statt localStorage -----
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- --- Rabattcodes (exklusive Erstbesteller-Codes + Punkte-Prämien) ----
CREATE TABLE IF NOT EXISTS discount_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  percent_off INTEGER NOT NULL,
  source TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  stripe_coupon_id TEXT,
  stripe_promotion_code_id TEXT,
  max_redemptions INTEGER DEFAULT 1,
  times_redeemed INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- --- News-Channel ------------------------------------------------------
CREATE TABLE IF NOT EXISTS news_posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  push_sent_at TIMESTAMP,
  email_sent_at TIMESTAMP
);

-- ===================================================================
-- Challenge-Daten reparieren
-- ===================================================================

-- BUG: db/migrations/add_full_features.sql hat ein nacktes
-- "ON CONFLICT DO NOTHING" benutzt, OHNE dass auf "challenges" je ein
-- UNIQUE-Constraint existierte. Ohne passenden Constraint hat die Klausel
-- GAR KEINE Wirkung - bei jedem erneuten Ausführen dieser Migration (z.B.
-- durch einen Migrations-Runner, der nicht trackt was schon lief) wurden
-- dieselben 4 Challenges (u.a. "Erster Kauf") einfach nochmal eingefügt.
-- Das ist der Grund, warum "Erster Kauf" mehrfach in der Liste auftaucht.
--
-- Fix: Duplikate (gleicher Titel) zusammenführen - die mit der kleinsten
-- id bleibt, alle anderen werden gelöscht. Eventuelle user_challenges,
-- die (theoretisch) auf eine zu löschende Duplikat-Zeile zeigen, werden
-- vorher auf die verbleibende Zeile umgehängt, damit niemand seinen
-- Fortschritt verliert.
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

-- Jetzt erst kann ein UNIQUE-Constraint sauber gesetzt werden, damit das
-- Problem nie wieder auftreten kann, egal wie oft Migrationen erneut laufen.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'challenges_title_unique'
  ) THEN
    ALTER TABLE challenges ADD CONSTRAINT challenges_title_unique UNIQUE (title);
  END IF;
END $$;

-- "Early Adopter" (Typ early_adopter) und "Einer der Ersten" (Typ
-- first_100) sind exakt dasselbe Kriterium (erste 100 Mitglieder), aber
-- als zwei verschiedene Challenges angelegt worden. Nur "first_100" wird
-- vom Code tatsächlich vergeben - "early_adopter" konnte NIE erledigt
-- werden. Wir deaktivieren das doppelte/totes "early_adopter", "first_100"
-- bleibt die einzige aktive Variante davon.
UPDATE challenges SET active = false WHERE type = 'early_adopter';

-- Falls jemand (durch o.g. Bug) schon Punkte/Einträge für das doppelte
-- "early_adopter" bekommen hätte, behalten wir die Historie (kein Datenverlust),
-- vergeben aber ab jetzt nur noch über "first_100".

-- "review" und "referral" Challenges können wir technisch nicht serverseitig
-- verifizieren (kein Bot/keine Review-API angebunden) - die bleiben bewusst
-- selbst zu bestätigen. discord_join bleibt aus demselben Grund selbst zu
-- bestätigen. ALLE anderen Typen (first_order, repeat_customer,
-- complete_profile, early_adopter/first_100, newsletter, push,
-- theme_explorer) werden ausschließlich serverseitig durch den Code
-- vergeben (siehe app/actions.ts / app/cart.ts) - der Client kann sie nicht
-- mehr selbst antriggern (siehe SELF_REPORT_TYPES Check in actions.ts).
