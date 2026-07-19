import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions";
import { getSetting, CHAT_ROLE_ACCESS_KEY } from "@/app/utils/settings";
import { hasChatAccess, CHAT_ROLE_ACCESS_DEFAULT } from "@/app/admin/permissions";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/avif", "image/gif",
  "application/pdf", "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4", "video/webm",
];
const MAX_SIZE = 4 * 1024 * 1024; // 4 MB - Vercel Function Body Limit

// Serverseitiger Upload statt Client-Token-Verfahren, siehe
// app/api/admin/upload/route.ts für die ausführliche Begründung. Eigener
// Endpoint statt admin-upload wiederzuverwenden, weil hier Chat-Zugriff
// reicht statt vollem Admin-Status.
export async function POST(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  const roleDefaults = await getSetting(CHAT_ROLE_ACCESS_KEY, CHAT_ROLE_ACCESS_DEFAULT);
  if (!hasChatAccess(user, roleDefaults)) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN fehlt in den Umgebungsvariablen.");
    return NextResponse.json({ error: "Server-Konfigurationsfehler: BLOB_READ_WRITE_TOKEN ist nicht gesetzt." }, { status: 500 });
  }

  try {
    const blob = await put(file.name, file, { access: "public", addRandomSuffix: true });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("Chat-Anhang-Upload (serverseitig) fehlgeschlagen:", message);
    return NextResponse.json({ error: `Upload fehlgeschlagen: ${message}` }, { status: 500 });
  }
}
