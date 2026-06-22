-- Sicherheits-Update: Access Keys bekommen ein Ablaufdatum, damit ein alter,
-- versehentlich weitergeleiteter oder geleakter Key nicht ewig gültig bleibt.
ALTER TABLE access_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE access_keys ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Bestehende, noch nicht abgelaufene Keys bekommen 7 Tage ab jetzt Gültigkeit,
-- damit niemand sofort ausgesperrt wird.
UPDATE access_keys
SET expires_at = NOW() + INTERVAL '7 days'
WHERE expires_at IS NULL AND is_used = false;
