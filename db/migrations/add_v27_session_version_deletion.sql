-- ===================================================================
-- v27: Session-Invalidierung (Versions-Zähler) + Account-Löschung mit
-- 7-Tage-Einwandsfrist
-- ===================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP;
