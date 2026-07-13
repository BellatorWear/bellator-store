import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions";

// Reiner Bild-Upload für Produkte/Farben/Startseiten-Posts. Getrennt von
// /api/admin/upload-attachment, weil hier bewusst NUR echte Bildformate
// erlaubt sein sollen (Anhänge dürfen mehr: PDF, ZIP, Office, Video).
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
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
          addRandomSuffix: true,
          maximumSizeInBytes: 15 * 1024 * 1024,
          tokenPayload: JSON.stringify({ uploadedBy: user.email }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Bild hochgeladen:", blob.url, blob.pathname);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = (error as Error).message ?? "Unbekannter Fehler";
    console.error("Upload-Token-Fehler (Bild):", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
