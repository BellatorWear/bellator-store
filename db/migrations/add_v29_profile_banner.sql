-- ===================================================================
-- v29: Selbst gestaltbares Profilbanner
-- ===================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT;
