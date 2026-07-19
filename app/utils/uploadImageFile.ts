// Gemeinsamer Helper für alle Datei-Uploads (Produkte, Farben,
// Startseiten-Posts, Newsletter-Anhänge, Chat-Anhänge). Ersetzt den
// bisherigen client-seitigen @vercel/blob/client-Weg (Token holen, Browser
// lädt direkt zu Blob-Storage hoch) durch einen einfachen fetch() an
// unseren eigenen Server-Endpoint, der die Datei entgegennimmt und selbst
// zu Vercel Blob hochlädt - siehe app/api/admin/upload/route.ts für die
// ausführliche Begründung des Wechsels.
export async function uploadFileViaServer(
  file: File,
  endpoint: string = "/api/admin/upload",
): Promise<{ url?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(endpoint, { method: "POST", body: formData });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.url) {
      return { error: data?.error ?? `Upload fehlgeschlagen (Status ${res.status}).` };
    }
    return { url: data.url as string };
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unbekannter Fehler";
    console.error("Upload fehlgeschlagen (Client):", raw);
    return { error: `Verbindungsfehler beim Upload: ${raw}` };
  }
}

// Beibehalten für die bereits umgestellten Aufrufstellen (Bild-Uploads
// ohne expliziten Endpoint-Parameter).
export async function uploadImageFile(file: File): Promise<{ url?: string; error?: string }> {
  return uploadFileViaServer(file, "/api/admin/upload");
}
