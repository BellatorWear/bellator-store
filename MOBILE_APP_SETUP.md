# Bellator Mobile App — Setup-Anleitung

Der komplette Code ist vorbereitet (Capacitor-Konfiguration, native
Push-Anbindung, App-Icons). Was jetzt noch fehlt, muss zwangsläufig auf
deinem eigenen Rechner passieren — ich habe keinen Zugriff auf Xcode, Android
Studio, oder deine App-Store-Accounts.

## Was du brauchst

- **Für iOS:** ein Mac mit installiertem [Xcode](https://apps.apple.com/de/app/xcode/id497799835)
  (kostenlos, aber nur auf macOS installierbar). Ohne Mac geht iOS-Build
  nicht — das ist eine Apple-Vorgabe, keine Einschränkung dieses Projekts.
- **Für Android:** [Android Studio](https://developer.android.com/studio)
  (läuft auf Windows/Mac/Linux, kostenlos).
- Node.js (hast du schon, für die normale Bellator-Entwicklung).

## 1. Projekt vorbereiten (einmalig)

```bash
npm install
npm run app:add-ios       # nur wenn du einen Mac hast
npm run app:add-android
```

Das legt zwei neue Ordner an: `ios/` und `android/` — die eigentlichen
nativen Projekte. Diese NICHT von Hand bearbeiten, sondern über die
jeweilige IDE (Xcode/Android Studio).

## 2. App-Icons & Splash-Screen generieren

Die Master-Dateien liegen schon bereit (`resources/icon.png`,
`resources/splash.png` — aus eurem bestehenden Bellator-Branding erzeugt).

```bash
npm run app:assets
```

Das erzeugt automatisch alle von iOS/Android geforderten Icon-Größen aus
den beiden Master-Dateien. Willst du ein anderes Icon/Splash-Design, einfach
`resources/icon.png` (1024×1024) und `resources/splash.png` (2732×2732)
ersetzen und den Befehl erneut ausführen.

## 3. Push-Notifications einrichten (Firebase, kostenlos)

Sowohl iOS als auch Android laufen über Firebase Cloud Messaging (FCM) —
Google übernimmt dabei auch das Zustellen an Apple-Geräte (APNs), du
brauchst nur EIN Firebase-Projekt für beide Plattformen.

1. [Firebase Console](https://console.firebase.google.com) → "Projekt
   hinzufügen" → Namen vergeben (z.B. "Bellator Streetwear")
2. **Für Android:** In der Firebase-Konsole eine Android-App hinzufügen,
   Package-Name exakt `de.mzdev.bellator` eintragen (steht so in
   `capacitor.config.ts`). Lädt eine `google-services.json` herunter →
   die Datei nach `android/app/google-services.json` legen.
3. **Für iOS:** In der Firebase-Konsole eine iOS-App hinzufügen, Bundle-ID
   exakt `de.mzdev.bellator`. Zusätzlich brauchst du einen APNs-Auth-Key
   von Apple (im [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
   unter "Keys" → "+" → "Apple Push Notifications service (APNs)"
   aktivieren) — den lädst du dann in der Firebase-Konsole unter
   Projekteinstellungen → Cloud Messaging → Apple-App-Konfiguration hoch.
4. **Server-Zugang:** Firebase-Konsole → Projekteinstellungen →
   Dienstkonten → "Neuen privaten Schlüssel generieren" → lädt eine JSON-
   Datei herunter. Den **kompletten Inhalt** dieser Datei als Vercel-
   Umgebungsvariable `FIREBASE_SERVICE_ACCOUNT_JSON` eintragen (als
   einzeiliger String — die meisten Editoren können eine JSON-Datei zu
   einer Zeile minifizieren).

Ohne Schritt 4 funktioniert die App trotzdem — Push-Benachrichtigungen
werden dann einfach übersprungen (fail-open, wie bei den anderen optionalen
Integrationen in diesem Projekt).

## 4. Lokal testen

```bash
npm run app:sync          # nach JEDER Änderung an capacitor.config.ts
npm run app:open-ios      # öffnet Xcode
npm run app:open-android  # öffnet Android Studio
```

In Xcode/Android Studio dann ganz normal auf einem Simulator oder echten
Gerät ausführen (Play-Button). Die App lädt beim Start `https://mz-dev.de` —
stell also sicher, dass die Produktivseite erreichbar ist, bevor du testest.

## 5. Bei Apple/Google Store einreichen

Das ist der einzige Teil, den ich wirklich nicht vorbereiten kann — braucht
deine echten Zahlungsdaten und Identitätsprüfung:

- **Apple:** [Apple Developer Program](https://developer.apple.com/programs/enroll/)
  beitreten (99$/Jahr), dann in Xcode → Product → Archive → An App Store
  Connect hochladen. Erstes Review dauert meist 1-2 Tage.
- **Google:** [Play Console](https://play.google.com/console/signup)
  Account anlegen (25$ einmalig), dort Store-Eintrag ausfüllen (Screenshots,
  Beschreibung, Datenschutzerklärung-URL — eure Datenschutzseite passt) und
  eine signierte `.aab`-Datei aus Android Studio hochladen.

## Wichtig zu wissen

Die App lädt eure echte, live laufende Website in einer nativen Hülle
(siehe Kommentar in `capacitor.config.ts` für die technische Begründung).
Das heißt: **jede Änderung, die du normal per Batch-Update auf der
Website machst, ist sofort auch in der App sichtbar** — kein erneuter
Store-Review nötig, außer du änderst App-Icon, Name, oder fügst neue
native Funktionen hinzu.
