-- ===================================================================
-- v31: Race Condition bei Pre-Release-Code-Einlösung schließen
-- ===================================================================
-- redeemCode() prüfte bisher per SELECT, wie oft ein Account einen Code
-- schon eingelöst hat, und hat DANACH erst den INSERT gemacht - bei
-- gleichzeitigen Anfragen konnten alle denselben (noch nicht
-- aktualisierten) Zählerstand sehen und den Code öfter einlösen als
-- max_uses_per_account erlaubt.
--
-- Anders als beim Challenge-Fix (add_v30) reicht hier ein simpler
-- UNIQUE-Constraint nicht, weil das Limit auch >1 sein kann (admin-
-- seitig frei einstellbar). Und weil wir über den Neon-HTTP-Treiber
-- laufen (keine echten mehrzeiligen Transaktionen von der App-Seite aus
-- möglich), muss die Absicherung direkt in der DB als Trigger passieren -
-- der läuft serverseitig als Teil des einzelnen INSERT-Statements, ganz
-- unabhängig davon, wie die App die Verbindung aufbaut.
--
-- SELECT ... FOR UPDATE auf die Code-Zeile sorgt dafür, dass zwei
-- gleichzeitige Einlösungen DESSELBEN Codes serialisiert werden (die
-- zweite wartet, bis die erste fertig ist) - erst danach wird gezählt,
-- damit die zweite Einlösung den bereits aktualisierten Stand sieht.
CREATE OR REPLACE FUNCTION check_prerelease_redemption_limit() RETURNS TRIGGER AS $$
DECLARE
  max_uses INTEGER;
  current_uses INTEGER;
BEGIN
  SELECT max_uses_per_account INTO max_uses FROM pre_release_codes WHERE id = NEW.code_id FOR UPDATE;

  IF max_uses IS NOT NULL THEN
    SELECT COUNT(*) INTO current_uses
      FROM pre_release_redemptions
      WHERE code_id = NEW.code_id AND user_id = NEW.user_id;

    IF current_uses >= max_uses THEN
      RAISE EXCEPTION 'PRERELEASE_LIMIT_EXCEEDED';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prerelease_redemption_limit_check ON pre_release_redemptions;
CREATE TRIGGER prerelease_redemption_limit_check
  BEFORE INSERT ON pre_release_redemptions
  FOR EACH ROW EXECUTE FUNCTION check_prerelease_redemption_limit();
