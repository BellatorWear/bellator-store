import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Nur Admins dürfen hochladen.
        const user = await getCurrentUser();
        if (!user || !user.isAdmin) {
          throw new Error("Keine Berechtigung.");
        }

        return {
          // GIF wird bewusst ausgeschlossen (zu große Dateien, nicht
          // nötig für Produktbilder).
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
          // Zufälliger Suffix verhindert URL-Kollisionen bei gleichem Dateinamen.
          addRandomSuffix: true,
          // 20 MB sollten für hochauflösende Produktbilder mehr als genug sein.
          maximumSizeInBytes: 20 * 1024 * 1024,
          // Wird öffentlich gespeichert (nicht das Blob-Store-Geheimnis).
          // Genau das erlaubt das direkte Einbinden im Frontend als <img src>.
          tokenPayload: JSON.stringify({ uploadedBy: user.email }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Nur Logging - wird im Hintergrund von Vercel aufgerufen, nachdem
        // der Browser die Datei direkt bei Vercel Blob abgeliefert hat.
        // Falls diese Callback-Anfrage aus irgendeinem Grund fehlschlägt
        // (z.B. weil man lokal entwickelt und Vercel die lokale URL nicht
        // erreichen kann), ist das Bild trotzdem schon hochgeladen.
        console.log("Produktbild hochgeladen:", blob.url, blob.pathname);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = (error as Error).message ?? "Unbekannter Fehler";
    console.error("Upload-Token-Fehler:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
