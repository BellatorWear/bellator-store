-- ===================================================================
-- v16: Doppelte Emails in der users-Tabelle verhindern
--
-- Root Cause im Code (siehe app/actions.ts):
-- 1. Email wurde nirgends normalisiert (kein .trim().toLowerCase()) -
--    "Test@Foo.com" und "test@foo.com" galten als unterschiedlich,
--    sowohl beim Login als auch beim Anlegen des Accounts.
-- 2. Der Magic-Link-Flow prüfte per SELECT ob ein User existiert und hat
--    dann erst per INSERT angelegt (statt atomarem Upsert) - bei zwei
--    gleichzeitigen Anfragen (Doppelklick, zwei Tabs) konnten beide die
--    Prüfung passieren, bevor der erste INSERT fertig war.
-- Beides wurde im Code gefixt. Diese Migration räumt die DB entsprechend
-- auf und verhindert das Problem strukturell.
--
-- WICHTIG - BITTE IN DIESER REIHENFOLGE AUSFÜHREN:
-- ===================================================================

-- Schritt 1 (VORHER unbedingt manuell anschauen): zeigt alle aktuell
-- vorhandenen Duplikate (gleiche Email, unterschiedliche Groß-/
-- Kleinschreibung). Wenn hier Zeilen mit "echten" Accounts auftauchen
-- (Punkte, Bestellungen, beide mit Passwort), diese von Hand
-- zusammenführen, BEVOR Schritt 4 läuft - Schritt 2 löscht nur
-- eindeutig leere Karteileichen automatisch.
SELECT LOWER(email) AS email_lower, COUNT(*), array_agg(id ORDER BY id) AS user_ids
FROM users
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

-- Schritt 2: automatisches, konservatives Aufräumen - löscht nur Zeilen
-- ohne Passwort, ohne Punkte, ohne Bestellungen (liegen gebliebene
-- Magic-Link-Platzhalter aus abgebrochenen Anfragen), wenn für dieselbe
-- Email (case-insensitive) eine vollständigere Zeile existiert.
DELETE FROM users u
USING users keep
WHERE LOWER(u.email) = LOWER(keep.email)
  AND u.id <> keep.id
  AND u.password_hash IS NULL
  AND COALESCE(u.points, 0) = 0
  AND COALESCE(u.order_count, 0) = 0
  AND (keep.password_hash IS NOT NULL OR keep.id < u.id);

-- Schritt 3: verbleibende Emails auf lowercase normalisieren.
UPDATE users SET email = LOWER(email) WHERE email <> LOWER(email);

-- Schritt 4: normaler eindeutiger Index auf email (falls die in schema.ts
-- deklarierte .unique() nie tatsächlich als DB-Constraint angelegt wurde -
-- genau das war vermutlich die Ursache des ganzen Problems). Der
-- Upsert-Fix in app/actions.ts (onConflictDoNothing) braucht diesen
-- Index, um Race-Conditions abzufangen statt einen harten DB-Fehler zu
-- werfen.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_exact ON users (email);

-- Schritt 5: zusätzlich case-insensitive eindeutigen Index setzen, als
-- zweite Absicherung. Schlägt fehl, wenn nach Schritt 2 noch "echte"
-- Duplikate übrig sind (beide Zeilen hatten Aktivität) - in dem Fall
-- Schritt 1 erneut ausführen und von Hand entscheiden, welcher Account
-- bleibt (z.B. Punkte/Bestellungen auf den bleibenden Account
-- übertragen, den anderen dann per Hand löschen).
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_ci ON users (LOWER(email));
