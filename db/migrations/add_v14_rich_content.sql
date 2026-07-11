-- ===================================================================
-- v14: Freies HTML-Layout + Bilder + Anhänge für News-Posts (Newsletter)
--      und Home-Posts (Startseiten-Artikel)
-- ===================================================================

ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS body_html TEXT;
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

ALTER TABLE home_posts ADD COLUMN IF NOT EXISTS body_html TEXT;
ALTER TABLE home_posts ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
