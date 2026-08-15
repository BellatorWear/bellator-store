import Script, { type ScriptProps } from "next/script";

/**
 * Subresource Integrity (SRI) für extern geladene Skripte.
 *
 * Aktuell (Stand dieses Batches) lädt Bellator Streetwear KEIN einziges
 * Skript von einer fremden Domain per <script src> - Stripe und Pusher
 * laufen als npm-Pakete server-seitig, der Checkout ist ein kompletter
 * Redirect zu checkout.stripe.com statt eines eingebetteten Skripts.
 * Es gibt also aktuell nichts, worauf ein SRI-Hash angewendet werden
 * müsste.
 *
 * Diese Komponente existiert trotzdem schon jetzt: Sobald irgendwann ein
 * externes Skript dazukommt (z. B. Google Tag Manager, eine Font-CDN,
 * ein Analytics-Snippet), MUSS es über diese Komponente statt über
 * next/script direkt oder ein rohes <script>-Tag eingebunden werden.
 * TypeScript erzwingt dabei, dass `integrity` gesetzt ist - ein Skript
 * ohne Hash lässt sich damit gar nicht erst einbauen.
 *
 * WICHTIG bei der Wahl neuer externer Skripte: Viele CDN-Skripte
 * (allen voran Google Tag Manager und Google Analytics/gtag.js) werden
 * vom Anbieter selbst laufend und ohne Versionierung ausgetauscht.
 * SRI-Hashes brechen dann bei jedem Anbieter-Update automatisch die
 * Seite. Für solche "lebenden", nicht versionierten Skripte ist SRI
 * ungeeignet - dort schützt stattdessen die CSP script-src-Allowlist
 * in next.config.ts (Herkunft der Domain wird geprüft, nicht der
 * exakte Byte-Inhalt). SRI eignet sich vor allem für fest versionierte
 * Assets (z. B. eine konkrete cdnjs-Version einer Bibliothek).
 *
 * Hash erzeugen: `openssl dgst -sha384 -binary datei.js | openssl base64 -A`
 * oder https://www.srihash.org (Datei vorher selbst herunterladen und
 * mit dem Original-Hash des Anbieters vergleichen, nicht blind der
 * Webseite vertrauen).
 */
type ExternalScriptProps = ScriptProps & {
  /** SHA-384 (oder SHA-256/512) Integrity-Hash, z. B. "sha384-...". Pflichtfeld. */
  integrity: string;
};

export default function ExternalScript({ integrity, crossOrigin, ...props }: ExternalScriptProps) {
  return <Script integrity={integrity} crossOrigin={crossOrigin ?? "anonymous"} {...props} />;
}
