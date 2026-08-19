# Bellator Streetwear — Backlog

Offene Aufgaben, noch nicht umgesetzt. Wird bei jedem neuen Batch aktualisiert
(erledigte Punkte wandern mit Batch-Nummer + Version in den "Erledigt"-
Abschnitt ganz unten).

Stand: nach v4.2.3 (Batch 80)

---

## Offen

_(Keine offenen Punkte mehr aus der letzten Anforderungsliste.)_

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
- Challenges/Punkte/Prämien-Reset für alle User im Admin-Panel, mit
  Textbestätigung gegen Versehen. Wipe + automatische Neu-Prüfung aller
  aus echten Daten ableitbaren Challenges (Bestellungen, Reviews,
  Newsletter, Push, Profil-Vollständigkeit, Referral) inkl. korrekter
  Punkte-Wiederherstellung aus der Bestellhistorie (10 Punkte/Euro).
  Bewusst NICHT automatisch wiederherstellbar: Discord-Beitritt (keine
  gespeicherte Discord-ID, nur einmalige Live-Prüfung beim Verknüpfen)
  und manuelle/einmalige Challenges ohne Datenspur — Batch 83 (v4.4.0)
- Native Mobile App (iOS & Android) via Capacitor: Remote-URL-Modus (App
  lädt die echte, live laufende Website statt eines statischen Exports -
  Server Actions/DB/Sessions bleiben dadurch unverändert funktionsfähig).
  Native Push-Notifications über Firebase Cloud Messaging (getrennter
  Kanal neben Web Push, User kann beides parallel haben). App-Icons/
  Splash-Screen aus dem bestehenden Branding generiert.
  MOBILE_APP_SETUP.md mit vollständiger Anleitung für den Rest (Xcode/
  Android-Studio-Setup, Firebase-Projekt, Store-Einreichung) - die
  Teile, die zwangsläufig auf Michaels eigenem Rechner/Account passieren
  müssen — Batch 84 (v4.5.0)
