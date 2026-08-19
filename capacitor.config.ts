import type { CapacitorConfig } from "@capacitor/cli";

/**
 * WICHTIG: server.url zeigt auf die ECHTE, live laufende Website statt
 * einen statischen Export einzubetten. Grund: Bellator ist eine
 * server-seitig gerenderte Next.js-App (Server Actions für Checkout/Chat/
 * Admin, DB-Queries in Server Components, Session-Cookies, Middleware/
 * Proxy) - ein statischer Export würde nahezu jede Funktion der Seite
 * brechen (Warenkorb, Login, Team-Chat, Admin-Panel, alles). Die native
 * App ist dadurch technisch eine WebView, die eure normale Website lädt -
 * das ist KEIN Kompromiss gegenüber "echten" nativen Apps für einen Shop
 * wie diesen: die Business-Logik bleibt exakt dieselbe, Updates am
 * Web-Code sind SOFORT auch in der App sichtbar, ohne neuen App-Store-
 * Review-Zyklus. Was die native Hülle zusätzlich bringt: echtes App-Icon,
 * Splash-Screen, Store-Präsenz, und vor allem native Push-Notifications
 * (siehe @capacitor/push-notifications statt der bisherigen Web-Push-
 * Lösung, die auf iOS nur eingeschränkt funktioniert).
 */
const config: CapacitorConfig = {
  appId: "de.mzdev.bellator",
  appName: "Bellator",
  webDir: "public", // wird im Remote-URL-Modus nicht wirklich genutzt, Capacitor verlangt trotzdem einen Wert
  server: {
    url: "https://mz-dev.de",
    androidScheme: "https",
    // cleartext NICHT aktiviert - erzwingt HTTPS, kein Downgrade auf
    // unverschlüsseltes HTTP möglich, auch nicht versehentlich.
  },
  ios: {
    contentInset: "automatic",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#000000",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK", // helle Schrift auf dem schwarzen Bellator-Branding
    },
  },
};

export default config;
