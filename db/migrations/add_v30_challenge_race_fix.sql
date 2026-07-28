-- ===================================================================
-- v30: Race Condition bei Challenge-Abschluss schließen
-- ===================================================================
-- awardChallengeByType() prüfte bisher nur per SELECT, ob eine Challenge
-- schon abgeschlossen ist, und hat DANACH erst den INSERT gemacht - bei
-- mehreren gleichzeitigen Requests (z.B. schnell mehrfach geklickt oder
-- gezielt gescriptet) konnten alle den SELECT gleichzeitig als "noch
-- nicht erledigt" sehen und alle Punkte gutgeschrieben bekommen. Ein
-- UNIQUE-Constraint auf DB-Ebene verhindert das zuverlässig, unabhängig
-- vom Timing der Anfragen - eine Anwendungsebenen-Prüfung kann das nicht.

-- Falls durch den Bug bereits Duplikate entstanden sind: erst
-- bereinigen (frühesten Eintrag pro User+Challenge behalten), sonst
-- würde der folgende ADD CONSTRAINT fehlschlagen.
DELETE FROM user_challenges a
USING user_challenges b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.challenge_id = b.challenge_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_challenges_user_challenge_unique'
  ) THEN
    ALTER TABLE user_challenges
      ADD CONSTRAINT user_challenges_user_challenge_unique UNIQUE (user_id, challenge_id);
  END IF;
END $$;
