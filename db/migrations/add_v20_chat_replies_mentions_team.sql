-- ===================================================================
-- v20: Chat - Antworten auf Nachrichten, @Erwähnungen (kein Schema
-- nötig, nur Text-Parsing), Team-Attribut mit Auto-Channel
-- ===================================================================

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_team BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to_id);
