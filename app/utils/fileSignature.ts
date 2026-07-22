// Prüft die tatsächlichen ersten Bytes einer Datei (Magic Bytes/File
// Signature) gegen den vom Client gesendeten MIME-Type. Der Browser sendet
// den "type" einer File aus der Dateiendung bzw. dem, was der Client
// behauptet - das lässt sich beliebig fälschen (z.B. eine .html einfach in
// "bild.png" umbenennen). Ein Abgleich mit den echten Anfangsbytes der
// Datei ist deutlich robuster, auch wenn er kein Ersatz für vollständige
// Format-Validierung ist - es geht hier nur darum, grobe Fälschungen
// (Fremdformat als Bild/Dokument getarnt) zuverlässig abzufangen.

type DetectedKind =
  | "jpeg" | "png" | "gif" | "webp" | "pdf"
  | "zip-or-docx" | "doc" | "webm" | "iso-bmff" // mp4/avif/mov-Familie, alle nutzen dieselbe ftyp-Box
  | "unknown";

function startsWith(bytes: Uint8Array, sig: number[], offset = 0): boolean {
  if (bytes.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (bytes[offset + i] !== sig[i]) return false;
  }
  return true;
}

function detectFileKind(bytes: Uint8Array): DetectedKind {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return "gif"; // GIF87a / GIF89a
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf";
  if (
    startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(bytes, [0x50, 0x4b, 0x07, 0x08])
  ) {
    // .docx ist technisch ein ZIP-Container - auf dieser Ebene (erste
    // Bytes) nicht von einem echten .zip unterscheidbar, ohne das interne
    // Manifest zu lesen. Beide teilen sich deshalb bewusst diese Kategorie.
    return "zip-or-docx";
  }
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "doc"; // altes OLE .doc
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return "webm";
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  if (startsWith(bytes, [0x66, 0x74, 0x79, 0x70], 4)) return "iso-bmff"; // mp4/avif/mov: gemeinsame ftyp-Box
  return "unknown";
}

const KIND_TO_ALLOWED_MIME: Record<Exclude<DetectedKind, "unknown">, string[]> = {
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  gif: ["image/gif"],
  webp: ["image/webp"],
  pdf: ["application/pdf"],
  "zip-or-docx": ["application/zip", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  doc: ["application/msword"],
  webm: ["video/webm"],
  "iso-bmff": ["video/mp4", "image/avif"],
};

/**
 * Liest die ersten Bytes der Datei und prüft, ob sie zum behaupteten
 * MIME-Type passen. Gibt true zurück, wenn die Signatur zum Typ passt -
 * false bei Mismatch ODER wenn das Format gar nicht erkannt wurde (dann
 * lieber ablehnen als blind vertrauen).
 */
export async function fileContentMatchesDeclaredType(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const kind = detectFileKind(header);
  if (kind === "unknown") return false;
  return KIND_TO_ALLOWED_MIME[kind]?.includes(file.type) ?? false;
}
