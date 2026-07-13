import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions";
import { getSetting, CHAT_ROLE_ACCESS_KEY } from "@/app/utils/settings";
import { hasChatAccess, CHAT_ROLE_ACCESS_DEFAULT } from "@/app/admin/permissions";

// Eigener Endpoint statt /api/admin/upload(-attachment) wiederzuverwenden:
// die sind admin-gated, aber jedes Team-Mitglied mit Chat-Zugriff (auch
// Developer/Marketing ohne vollen Admin-Status) soll im Chat Dateien
// anhängen dürfen.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await getCurrentUser();
        if (!user) throw new Error("Nicht eingeloggt.");
        const roleDefaults = await getSetting(CHAT_ROLE_ACCESS_KEY, CHAT_ROLE_ACCESS_DEFAULT);
        if (!hasChatAccess(user, roleDefaults)) throw new Error("Keine Berechtigung.");

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
        console.log("Chat-Anhang hochgeladen:", blob.url, blob.pathname);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = (error as Error).message ?? "Unbekannter Fehler";
    console.error("Upload-Token-Fehler (Chat-Anhang):", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
