/**
 * SSRF-Schutz (Server-Side Request Forgery) für ausgehende Server-Requests.
 *
 * STATUS-CHECK (Batch 81): Aktuell gibt es KEINE Stelle im Code, die eine
 * vom User/Admin eingegebene URL server-seitig abruft - alle bestehenden
 * fetch()-Aufrufe gehen an hartcodierte, vertrauenswürdige Domains
 * (discord.com, challenges.cloudflare.com) oder sind clientseitig (Browser
 * lädt Bild-URLs direkt, das ist normales Web-Verhalten, kein SSRF-Risiko,
 * weil dabei nicht der eigene Server die Anfrage stellt).
 *
 * Dieses Utility ist trotzdem als Schutzwall für die Zukunft da: SOBALD
 * irgendein Feature eine User-/Admin-eingegebene URL server-seitig
 * abrufen soll (z.B. "Avatar von URL importieren", RSS-Feed einlesen,
 * Link-Vorschau generieren, ausgehende Webhooks), MUSS das durch
 * safeFetch() hier laufen statt durch ein rohes fetch().
 *
 * Was geblockt wird:
 * - Alles außer http:/https: (file:, gopher:, ftp:, etc.)
 * - Private/interne IP-Bereiche: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16,
 *   127.0.0.0/8 (localhost), 169.254.0.0/16 (Link-Local, DA LIEGEN
 *   Cloud-Metadata-Endpunkte: AWS 169.254.169.254, GCP/Azure ähnlich -
 *   worüber sich sonst Cloud-Credentials abgreifen ließen), ::1 und
 *   private IPv6-Bereiche (fc00::/7, fe80::/10).
 * - DNS-Rebinding-Schutz: die URL wird per Hostname UND nach DNS-Auflösung
 *   nochmal anhand der tatsächlichen IP geprüft - ein Hostname wie
 *   "meineseite.de", der auf 127.0.0.1 zeigt, würde sonst den reinen
 *   String-Check umgehen.
 */

const PRIVATE_IPV4_RANGES: [number, number][] = [
  [ipToInt("10.0.0.0"), ipToInt("10.255.255.255")],
  [ipToInt("172.16.0.0"), ipToInt("172.31.255.255")],
  [ipToInt("192.168.0.0"), ipToInt("192.168.255.255")],
  [ipToInt("127.0.0.0"), ipToInt("127.255.255.255")],
  [ipToInt("169.254.0.0"), ipToInt("169.254.255.255")], // Link-Local / Cloud-Metadata
  [ipToInt("0.0.0.0"), ipToInt("0.255.255.255")],
];

function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function isPrivateIPv4(ip: string): boolean {
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return false;
  const val = ipToInt(ip);
  return PRIVATE_IPV4_RANGES.some(([start, end]) => val >= start && val <= end);
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" || // localhost
    normalized.startsWith("fc") || // fc00::/7 unique local
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80") || // link-local
    normalized === "::" ||
    normalized.startsWith("::ffff:127.") // IPv4-mapped localhost
  );
}

function isPrivateIP(ip: string): boolean {
  return ip.includes(":") ? isPrivateIPv6(ip) : isPrivateIPv4(ip);
}

export class SsrfBlockedError extends Error {
  constructor(url: string, reason: string) {
    super(`SSRF-Schutz: Request an "${url}" blockiert (${reason}).`);
    this.name = "SsrfBlockedError";
  }
}

/**
 * Prüft eine URL gegen SSRF-Kriterien, OHNE den Request zu stellen -
 * nützlich für Validierung direkt beim Speichern einer Admin-Eingabe.
 * Wirft SsrfBlockedError bei Verstoß.
 */
export async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError(rawUrl, "keine gültige URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfBlockedError(rawUrl, `Protokoll "${url.protocol}" nicht erlaubt`);
  }

  const hostname = url.hostname;
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".internal")) {
    throw new SsrfBlockedError(rawUrl, "interner Hostname");
  }

  // Falls der Hostname bereits eine IP ist: direkt prüfen.
  if (isPrivateIP(hostname)) {
    throw new SsrfBlockedError(rawUrl, "private IP-Adresse");
  }

  // DNS-Rebinding-Schutz: Hostname auflösen und die TATSÄCHLICHE(N) IP(s)
  // prüfen, nicht nur den String. Node-natives dns/promises statt fetch,
  // damit die Prüfung VOR dem eigentlichen Request passiert.
  try {
    const dns = await import("node:dns/promises");
    const records = await dns.lookup(hostname, { all: true });
    for (const record of records) {
      if (isPrivateIP(record.address)) {
        throw new SsrfBlockedError(rawUrl, `Hostname löst zu privater IP auf (${record.address})`);
      }
    }
  } catch (err) {
    if (err instanceof SsrfBlockedError) throw err;
    // DNS-Fehler (Hostname existiert nicht o.ä.) - als Fehler behandeln,
    // nicht stillschweigend durchlassen.
    throw new SsrfBlockedError(rawUrl, "Hostname konnte nicht aufgelöst werden");
  }

  return url;
}

/**
 * fetch()-Ersatz mit eingebauter SSRF-Prüfung. Für jedes zukünftige
 * Feature verwenden, das eine extern/vom User bereitgestellte URL
 * server-seitig abruft.
 */
export async function safeFetch(rawUrl: string, init?: RequestInit): Promise<Response> {
  const url = await assertSafeExternalUrl(rawUrl);
  return fetch(url.toString(), {
    ...init,
    redirect: "manual", // Redirects NICHT automatisch folgen - ein Angreifer
    // könnte sonst per 302 von einer erlaubten URL auf eine interne
    // umleiten und die Prüfung so umgehen. Bei Bedarf muss der Aufrufer
    // Redirects explizit selbst behandeln (erneut durch safeFetch schicken).
  });
}
