/**
 * Leichtgewichtiger UA-Parser NUR für eine freundliche Anzeige in "Aktive
 * Sitzungen" (z.B. "Chrome auf Windows") - keine sicherheitsrelevante
 * Erkennung, bewusst ohne externe Library (User-Agent-Parsing ist für
 * diesen Zweck simpel genug für ein paar Regex-Checks).
 */
export function parseUserAgent(ua: string | null | undefined): string {
  if (!ua) return "Unbekanntes Gerät";

  let os = "Unbekanntes System";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/iphone|ipad/i.test(ua)) os = "iOS";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/linux/i.test(ua)) os = "Linux";

  let browser = "Unbekannter Browser";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) browser = "Chrome";
  else if (/firefox\//i.test(ua)) browser = "Firefox";
  else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";

  return `${browser} auf ${os}`;
}
