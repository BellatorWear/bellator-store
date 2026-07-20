import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_SIZE = 4 * 1024 * 1024; // 4 MB - bewusst unter Vercels 4.5MB-Funktionslimit

// Läuft jetzt komplett serverseitig statt über das @vercel/blob/client
// Zwei-Schritt-Token-Verfahren (Token holen -> Browser lädt direkt zu Blob
// hoch). Der Client schickt die Datei direkt hierher, wir laden sie hier
// zu Vercel Blob hoch. Nachteil: Dateien sind auf ~4MB begrenzt (Vercel
// Function Body Limit). Vorteil: ein einziger, klar debugbarer Ort statt
// einer client-seitigen Direktverbindung zu Blob-Storage, die von CSP,
// Token-Konfiguration und Store-Verknüpfung gleichzeitig abhängt.
export async function POST(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage (kein FormData)." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei gefunden." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `Dateityp nicht erlaubt: ${file.type || "unbekannt"}` }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: `Datei zu groß (${(file.size / 1024 / 1024).toFixed(1)}MB, max. 4MB).` }, { status: 400 });
  }

  // Blob-Store "bellator-store-blob" wurde mit Custom-Prefix BLOB2 statt
  // dem Default BLOB verbunden -> Token heißt entsprechend BLOB2_READ_WRITE_TOKEN.
  if (!process.env.BLOB2_READ_WRITE_TOKEN) {
    console.error("BLOB2_READ_WRITE_TOKEN fehlt in den Umgebungsvariablen.");
    return NextResponse.json(
      { error: "Server-Konfigurationsfehler: BLOB2_READ_WRITE_TOKEN ist nicht gesetzt. Vercel Dashboard → Storage → Blob-Store mit diesem Projekt verbinden → neu deployen." },
      { status: 500 },
    );
  }

  try {
    const blob = await put(file.name, file, { access: "public", addRandomSuffix: true, token: process.env.BLOB2_READ_WRITE_TOKEN });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("Bild-Upload (serverseitig) fehlgeschlagen:", message);
    return NextResponse.json({ error: `Upload fehlgeschlagen: ${message}` }, { status: 500 });
  }
}
