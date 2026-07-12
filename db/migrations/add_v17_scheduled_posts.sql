-- ===================================================================
-- v17: Geplantes/automatisches Veröffentlichen für Startseiten-Posts
-- ===================================================================

ALTER TABLE home_posts ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP;
