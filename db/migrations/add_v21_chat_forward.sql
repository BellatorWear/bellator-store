-- ===================================================================
-- v21: Nachrichten weiterleiten
-- ===================================================================

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS forwarded_from_username TEXT;
