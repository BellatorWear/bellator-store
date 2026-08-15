/**
 * Allowlist für iframe-Video-Einbettungen (News-/Home-Posts).
 *
 * Hintergrund: `post.videoUrl` landet direkt als `iframe src` im DOM
 * (siehe app/page.tsx und app/post/[id]/page.tsx). Ohne Allowlist könnte
 * ein kompromittierter Admin-Account (oder ein Bug in der Rollen-Prüfung)
 * eine beliebige Fremd-Domain einbetten, die dann - trotz `sandbox` auf dem
 * iframe selbst - z. B. Clickjacking oder Phishing im Look des Shops
 * versuchen könnte. Deshalb wird serverseitig beim Speichern UND clientseitig
 * beim Rendern geprüft, dass die URL wirklich von einer erlaubten
 * Video-Plattform als Embed-Link stammt.
 *
 * Nur exakte Hostnamen, kein `.includes()` - sonst wäre
 * "https://youtube.com.evil.example/embed/x" ebenfalls gültig.
 */

const ALLOWED_EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
]);

/**
 * Prüft, ob eine Video-URL sicher als iframe eingebettet werden darf.
 * Erlaubt sind ausschließlich https-Embed-Links der oben gelisteten
 * YouTube-Domains (Pfad muss mit /embed/ beginnen).
 */
export function isSafeEmbedUrl(url: string): boolean {
  if (!url || url.length > 2048) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;
  if (!ALLOWED_EMBED_HOSTS.has(parsed.hostname)) return false;
  if (!parsed.pathname.startsWith("/embed/")) return false;

  return true;
}
