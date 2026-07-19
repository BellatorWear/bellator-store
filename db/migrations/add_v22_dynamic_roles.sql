-- ===================================================================
-- v22: Dynamische Rollen mit anklickbaren Berechtigungen
-- ===================================================================

CREATE TABLE IF NOT EXISTS custom_roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#a855f7',
  sections JSONB NOT NULL DEFAULT '[]',
  can_edit_posts BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Die bisherigen 3 fest einprogrammierten Rollen als Startbelegung, damit
-- sich am bestehenden Verhalten nichts ändert. ON CONFLICT DO NOTHING,
-- falls die Migration mehrfach läuft oder die Rollen schon existieren.
INSERT INTO custom_roles (name, label, color, sections, can_edit_posts) VALUES
  ('admin', 'Admin', '#a855f7',
   '["home-posts","news-channel","new-product","blob-status","existing-products","user-search","email-log","exclusive-codes","prerelease-codes","countdown","roles","team-chat"]',
   true),
  ('developer', 'Developer', '#3b82f6',
   '["new-product","existing-products","blob-status","exclusive-codes","prerelease-codes","countdown","home-posts","news-channel"]',
   true),
  ('marketing', 'Marketing', '#f59e0b',
   '["home-posts","news-channel"]',
   false)
ON CONFLICT (name) DO NOTHING;
