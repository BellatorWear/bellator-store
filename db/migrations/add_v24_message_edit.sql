-- ===================================================================
-- v24: Nachrichten bearbeiten - Zeitstempel für "bearbeitet"-Markierung
-- ===================================================================

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;
