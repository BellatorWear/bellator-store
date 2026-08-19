-- ===================================================================
-- v37: Session-Tabelle für "Aktive Sitzungen" (einzeln ausloggbar)
-- ===================================================================
-- Hintergrund: Sessions liefen bisher komplett stateless (signiertes
-- Cookie, kein DB-Eintrag) mit users.session_version als einzigem
-- Invalidierungs-Hebel - der wirft aber IMMER alle Sessions eines Users
-- auf einmal raus, es gab keine Möglichkeit, gezielt nur EIN Gerät
-- auszuloggen oder überhaupt zu sehen, welche Geräte gerade eingeloggt
-- sind. Diese Tabelle macht das möglich, ohne session_version zu
-- ersetzen (bleibt der "im Zweifel alles killen"-Nothebel, z.B. bei
-- Passwort-Reset).

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE, -- zufällige ID, steckt auch im signierten Cookie (jti)
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_hash TEXT, -- gehashte IP (nie im Klartext gespeichert, Datenschutz)
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP -- NULL = aktiv
);

-- "Meine aktiven Sitzungen" filtert immer nach user_id + revoked_at IS NULL.
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
-- Wird bei JEDEM authentifizierten Request nachgeschlagen (getCurrentUser) -
-- ohne Index hier wäre das ein Full-Table-Scan auf jedem einzelnen Request.
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
