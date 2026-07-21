-- ===================================================================
-- v23: Mehr Rollenattribute - granulare Berechtigungen, Team-Chat-Rechte,
-- Rang/Priorität für die Rollen-Hierarchie
-- ===================================================================

-- Granulare Admin-Berechtigungen, unabhängig von vollem isAdmin-Status.
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS can_manage_discount_codes BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS can_assign_roles BOOLEAN NOT NULL DEFAULT FALSE;
-- Reserviert für eine künftige User-Löschfunktion, die es aktuell im Code
-- noch nirgends gibt - der Schalter lässt sich schon setzen, greift aber
-- noch nicht, bis diese Funktion separat gebaut wird.
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS can_delete_users BOOLEAN NOT NULL DEFAULT FALSE;

-- Team-Chat-Rechte direkt an der Rolle statt nur am globalen Zugriffs-Flag.
-- can_create_channels defaultet auf TRUE, damit sich am bisherigen
-- Verhalten (jeder mit Chat-Zugriff durfte Channels anlegen) nichts ändert.
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS chat_can_create_channels BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS chat_can_delete_others_messages BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS chat_can_kick_members BOOLEAN NOT NULL DEFAULT FALSE;

-- Rang/Priorität: höhere Zahl = höherer Rang. Steuert Anzeigereihenfolge
-- und die Hierarchie bei can_assign_roles (jemand kann nur Rollen mit
-- niedrigerem Rang als dem eigenen vergeben, nicht gleich hoch oder höher).
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS rank INTEGER NOT NULL DEFAULT 0;

-- Sinnvolle Start-Ränge für die 3 bestehenden Rollen, damit die Hierarchie
-- direkt nutzbar ist. UPDATE statt im INSERT von v22, weil die Rollen dort
-- schon angelegt wurden.
UPDATE custom_roles SET rank = 100 WHERE name = 'admin' AND rank = 0;
UPDATE custom_roles SET rank = 50 WHERE name = 'developer' AND rank = 0;
UPDATE custom_roles SET rank = 10 WHERE name = 'marketing' AND rank = 0;
