import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File))
    return NextResponse.json(
      { error: "Keine Datei gefunden." },
      { status: 400 },
    );
  if (file.size > 4 * 1024 * 1024)
    return NextResponse.json({ error: "Datei zu groß." }, { status: 400 });
  if (!process.env.BLOB2_READ_WRITE_TOKEN)
    return NextResponse.json(
      { error: "Blob-Upload nicht konfiguriert." },
      { status: 500 },
    );

  const blob = await put(file.name, file, {
    access: "public",
    addRandomSuffix: true,
    token: process.env.BLOB2_READ_WRITE_TOKEN,
  });
  return NextResponse.json({ url: blob.url });
}
