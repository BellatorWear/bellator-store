# Bellator Streetwear — Backlog

Offene Aufgaben, noch nicht umgesetzt. Wird bei jedem neuen Batch aktualisiert
(erledigte Punkte wandern mit Batch-Nummer + Version in den "Erledigt"-
Abschnitt ganz unten).

Stand: nach v4.2.3 (Batch 80)

---

## Offen

### 1. Challenges/Punkte/Einlösungen für alle User zurücksetzen und neu prüfen lassen
Admin-Funktion: alle `user_challenges`, `point_transactions`, `user_rewards`
zurücksetzen und die Challenge-Bedingungen für jeden User neu gegen den
aktuellen Stand (Bestellungen, Reviews, etc.) evaluieren. Braucht sorgfältige
Planung - ist ein destruktiver Bulk-Vorgang auf Produktivdaten, sollte mit
Backup/Bestätigungsdialog abgesichert werden.

### 2. Native Mobile Apps (iOS & Android) via React Native/Expo
Größeres Vorhaben, eigene Codebase-Erweiterung. Bereits besprochen: PWA
(Batch 74) deckt einen Teil des Werts bereits ab (installierbar, Offline,
Sync), aber echte App-Store-Präsenz + volle native Push-Notifications
(besonders iOS) bräuchte tatsächlich Capacitor oder React Native/Expo.
Braucht eigene Entscheidung zu Aufwand/Budget (Apple Developer Program
99$/Jahr, Google Play 25$ einmalig), bevor hier Code geschrieben wird.

---

## Erledigt (Referenz)
- Automatisiertes Vulnerability-Scanning & Dependency-Pinning — Batch 72 (v3.13.0)
- SRI-Vorbereitung & Sandbox-Isolation für iframes — Batch 73 (v3.14.0)
- SEO-Grundlagen, Conversion, Resilienz, PWA — Batch 74 (v4.0.0)
- Versionsanzeige im Footer — Batch 75 (v4.0.0)
- Bot-Schutz (Login/Registrierung/Passwort-vergessen), Bild-Optimierung,
  Bundle-Splitting, Backdoor→lokales Skript, Health-Check — Batch 76 (v4.1.0)
- Honeypot Restock-Formular, Light Mode komplett entfernt — Batch 77 (v4.2.0)
- Fix: middleware/proxy-Kollision — Batch 78 (v4.2.1)
- Fix: tsconfig baseUrl-Deprecation — Batch 79 (v4.2.2)
- Fix: falsches Offline-Banner (navigator.onLine unzuverlässig) — Batch 80 (v4.2.3)
- SSRF-Schutz-Utility (safeFetch/assertSafeExternalUrl), geprüft: aktuell
  keine ausnutzbare Lücke vorhanden — Batch 81 (v4.3.0)
- Session-Management: DB-Session-Tabelle, "Aktive Sitzungen"-UI im Profil
  (einzeln/alle anderen Geräte ausloggen), Auto-Invalidierung bei
  Browser/OS-Wechsel (nicht bei reinem IP-Wechsel) — Batch 81 (v4.3.0)
- CAPTCHA auf Ticket-Erstellung ausgeweitet. Bewusst NICHT auf Chat
  (bereits login-pflichtig + eigenes Rate-Limiting pro Nachricht, CAPTCHA
  pro Chat-Nachricht wäre unpraktikable UX) — Batch 81 (v4.3.0)
- Frei schwebender Text bekommt Box: Artikel-Seite (Breadcrumb + Kategorie/
  Datum + Titel) gefixt. Alle anderen "Zurück"-Links/Seiten im Projekt
  systematisch geprüft (Produktseite, Belege, Tickets, Login-Varianten,
  Admin, News-Karten, Challenges) - hatten bereits Border/Hintergrund,
  kein weiterer Handlungsbedarf. Homepage-Hero bewusst NICHT geboxt (große
  Headline-Typografie, klares Design-Statement, keine
  Lesbarkeits-Schwäche wie bei kleiner Meta-Info) — Batch 82 (v4.3.1)
