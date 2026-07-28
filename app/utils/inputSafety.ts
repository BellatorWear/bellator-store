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
import DOMPurify from "isomorphic-dompurify";

// War vorher ein handgeschriebener Regex-Filter - nachweislich umgehbar,
// z.B. mit <img src=x/onerror=alert(1)> (kein Leerzeichen vor dem
// Event-Handler, durch "/" statt " " getrennt - Browser parsen das trotzdem
// als eigenes Attribut) oder HTML-Entities in javascript:-URLs
// (jav&#97;script:...). Regex-basiertes HTML-Sanitizing ist ein bekanntes
// Antipattern (siehe OWASP) - ein echter Parser wie DOMPurify kennt die
// tatsächliche HTML-Grammatik statt nach bekannten Mustern zu suchen, und
// arbeitet als Allowlist (nur explizit erlaubte Tags/Attribute kommen
// durch) statt als Blockliste (die immer nur bekannte Angriffe kennt).
const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "h1", "h2", "h3", "h4",
  "ul", "ol", "li",
  "a", "img", "blockquote", "span", "div", "hr", "code", "pre",
];
const ALLOWED_ATTR = ["href", "src", "alt", "title", "style", "target", "rel", "class"];

export function sanitizeHtml(input: string, maxLength = 20000): string {
  const truncated = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, maxLength);
  const clean = DOMPurify.sanitize(truncated, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
  return clean.trim();
}
