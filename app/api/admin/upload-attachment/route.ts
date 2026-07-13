import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions";

// Eigener Endpoint statt /api/admin/upload wiederzuverwenden: Anhänge
// dürfen mehr Dateitypen sein als die reinen Bild-Uploads bei Produkten
// (PDF, ZIP, Office-Dokumente), Bild-Uploads sollen aber weiterhin auf
// echte Bilder beschränkt bleiben.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await getCurrentUser();
        if (!user || !user.isAdmin) {
          throw new Error("Keine Berechtigung.");
        }

        return {
          allowedContentTypes: [
            "image/jpeg", "image/png", "image/webp", "image/avif", "image/gif",
            "application/pdf", "application/zip",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "video/mp4", "video/webm",
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 25 * 1024 * 1024,
          tokenPayload: JSON.stringify({ uploadedBy: user.email }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Anhang hochgeladen:", blob.url, blob.pathname);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = (error as Error).message ?? "Unbekannter Fehler";
    console.error("Upload-Token-Fehler (Anhang):", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
