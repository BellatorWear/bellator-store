import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions";

// Diese Route gibt selbst KEINE Datei entgegen, sondern nur ein kurzlebiges
// Upload-Token an den Browser - die eigentliche Bilddatei geht danach direkt
// vom Browser zu Vercel Blob, ohne durch diese (oder irgendeine andere)
// Server-Funktion zu laufen. Das ist der einzige Weg, Vercels hartes
// 4,5-MB-Limit pro Function-Request zu umgehen.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Nur Admins (per Tag in der DB, von dir manuell gesetzt) dürfen
        // ein Upload-Token bekommen. Ohne diesen Check könnte JEDER
        // beliebige Dateien in euren Blob-Store hochladen.
        const user = await getCurrentUser();
        if (!user || !user.isAdmin) {
          throw new Error("Keine Berechtigung.");
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          addRandomSuffix: true,
          maximumSizeInBytes: 20 * 1024 * 1024, // 20 MB pro Bild
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Produktbild hochgeladen:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
