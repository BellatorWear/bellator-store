-- ===================================================================
-- v15: Rollen-/Rechte-System fürs Bellator Team (Admin, Developer,
--      Marketing) - bestehende isAdmin-User werden automatisch auf die
--      Rolle 'admin' gesetzt, damit niemand den Zugriff verliert.
-- ===================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT;

UPDATE users SET role = 'admin' WHERE is_admin = true AND role IS NULL;
