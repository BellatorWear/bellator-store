/**
 * Schutz gegen ReDoS (Regular Expression Denial of Service) und versteckte
 * Regex-Statements in User-Input.
 *
 * Zwei Angriffsarten werden hier behandelt:
 * 1. Ein Angreifer schickt einen String, der wie ein Regex-Pattern aussieht
 *    (z.B. in ein Feld, das später mal für Suche/Filter genutzt werden
 *    könnte) - wird hier erkannt und abgelehnt, bevor er irgendwo als
 *    Pattern interpretiert wird.
 * 2. Ein Angreifer schickt einfach einen sehr langen String mit vielen
 *    Wiederholungen, der - falls er irgendwo gegen ein "böses" Regex mit
 *    catastrophic backtracking läuft - die CPU blockieren würde.
 *
 * Grundregel im Code: Es wird NIE ein RegExp aus rohem User-Input gebaut
 * (new RegExp(userInput)). Alle Validierungs-Regexe unten sind fest und
 * linear (kein catastrophic backtracking), und Input wird vorher in der
 * Länge begrenzt.
 */

const MAX_INPUT_LENGTH = 500;

// Erkennt, ob ein String selbst wie ein Regex-Pattern aussieht
// (Meta-Zeichen-Dichte zu hoch für normalen Text/Namen/Emails).
const REGEX_META_CHARS = /[\\^$.|?*+()[\]{}]/g;

export function isSuspiciousInput(input: string): boolean {
  if (typeof input !== "string") return true;
  if (input.length > MAX_INPUT_LENGTH) return true;

  // Bekannte ReDoS-Baumuster wie (a+)+, (a*)*, (.*)* etc.
  const knownReDoSPatterns = [
    /\([^)]*[+*]\)[+*]/, // (x+)+ , (x*)*
    /\(\.\*\)\+/,
    /\(\.\+\)\+/,
  ];
  if (knownReDoSPatterns.some((p) => p.test(input))) return true;

  // Hohe Dichte an Regex-Metazeichen relativ zur Länge -> sieht nach
  // einem eingeschleusten Pattern statt normalem Text aus.
  const metaCount = (input.match(REGEX_META_CHARS) ?? []).length;
  if (input.length > 10 && metaCount / input.length > 0.3) return true;

  return false;
}

/** Schneidet auf eine sichere Maximallänge und entfernt Steuerzeichen. */
export function sanitizeText(input: string, maxLength = MAX_INPUT_LENGTH): string {
  return input
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, maxLength)
    .trim();
}

/**
 * Erlaubt Admins, freies HTML für Artikel/Newsletter zu schreiben (Bilder,
 * Links, Formatierung), ohne eine externe Sanitizer-Library einzubinden.
 * Kein vollständiger HTML-Parser, sondern eine gezielte Allow-/Deny-Liste:
 * - <script>, <iframe>, <object>, <embed>, <link>, <meta>, <style> raus
 * - alle "on*"-Event-Handler-Attribute raus (onerror, onclick, ...)
 * - "javascript:"/"data:text/html"-URLs in href/src raus
 * Reicht NICHT für nicht-vertrauenswürdigen User-Input, aber hier schreiben
 * ausschließlich Admins - das ist eine zusätzliche Absicherung für den
 * Fall eines kompromittierten Admin-Accounts, keine Verteidigung gegen
 * die Admins selbst.
 */
export function sanitizeHtml(input: string, maxLength = 20000): string {
  let html = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, maxLength);

  // Komplett verbotene Tags samt Inhalt entfernen.
  html = html.replace(/<(script|style|iframe|object|embed|link|meta)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  html = html.replace(/<(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, "");

  // Event-Handler-Attribute (onerror=, onclick=, ...) entfernen.
  html = html.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
  html = html.replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  html = html.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");

  // javascript:/data:text/html - URLs in href/src entschärfen.
  html = html.replace(/(href|src)\s*=\s*"(?:\s*javascript:|\s*data:text\/html)[^"]*"/gi, '$1="#"');
  html = html.replace(/(href|src)\s*=\s*'(?:\s*javascript:|\s*data:text\/html)[^']*'/gi, "$1='#'");

  return html.trim();
}
