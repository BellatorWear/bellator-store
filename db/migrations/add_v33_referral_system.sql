-- ===================================================================
-- v33: Referral-System (Freunde werben) mit echter Verifizierung
-- ===================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_rewarded BOOLEAN DEFAULT FALSE;

-- Die "referral"-Challenge war bewusst deaktiviert, weil sie nur per
-- Selbstauskunft ohne Prüfung ging (siehe add_v9). Jetzt gibt es eine
-- echte Verifizierung: Punkte gibt's an den Werber erst, wenn der
-- geworbene Freund seine erste Bestellung abschließt (siehe
-- app/api/stripe-webhook/route.ts), nicht mehr per Selbst-Antippen.
UPDATE challenges SET active = true WHERE type = 'referral';
