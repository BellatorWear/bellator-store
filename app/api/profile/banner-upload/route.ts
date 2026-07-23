import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions";
import { fileContentMatchesDeclaredType } from "@/app/utils/fileSignature";
import { checkGeneralRateLimit } from "@/app/utils/ratelimit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 4 * 1024 * 1024; // 4 MB - Vercel Function Body Limit

// Erster Upload-Endpoint, der für JEDEN eingeloggten User offen ist (nicht
// nur Admins/Chat-Zugriff) - Fotos fürs eigene Profilbanner, und der
// finale gemalte Banner-Export selbst (PNG aus dem Canvas).
export async function POST(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });

  const rateLimit = await checkGeneralRateLimit();
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Zu viele Anfragen - kurz warten." }, { status: 429 });
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
  if (!(await fileContentMatchesDeclaredType(file))) {
    return NextResponse.json({ error: "Dateiinhalt passt nicht zum angegebenen Dateityp." }, { status: 400 });
  }

  if (!process.env.BLOB2_READ_WRITE_TOKEN) {
    console.error("BLOB2_READ_WRITE_TOKEN fehlt in den Umgebungsvariablen.");
    return NextResponse.json({ error: "Server-Konfigurationsfehler." }, { status: 500 });
  }

  try {
    const blob = await put(`banners/${user.id}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB2_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("Banner-Upload fehlgeschlagen:", message);
    return NextResponse.json({ error: `Upload fehlgeschlagen: ${message}` }, { status: 500 });
  }
}
