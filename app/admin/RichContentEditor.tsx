"use client";
import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

export type Attachment = { url: string; name: string };

export default function RichContentEditor({
  value,
  onChange,
  attachments,
  onAttachmentsChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  function insertAtCursor(snippet: string) {
    const el = textareaRef.current;
    if (!el) { onChange(value + snippet); return; }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
    // Cursor hinter den eingefügten Text setzen, nicht ans Ende springen.
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
    });
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    setError("");
    try {
      const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/admin/upload" });
      insertAtCursor(`\n<img src="${blob.url}" alt="" style="max-width:100%;display:block;margin:16px 0;" />\n`);
    } catch (err) {
      console.error("Bild-Upload fehlgeschlagen:", err);
      setError("Bild-Upload fehlgeschlagen. Ist der Blob Read/Write Token gesetzt?");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleAttachmentSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAttachment(true);
    setError("");
    try {
      const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/admin/upload-attachment" });
      onAttachmentsChange([...attachments, { url: blob.url, name: file.name }]);
    } catch (err) {
      console.error("Anhang-Upload fehlgeschlagen:", err);
      setError("Anhang-Upload fehlgeschlagen. Ist der Blob Read/Write Token gesetzt?");
    } finally {
      setUploadingAttachment(false);
    }
  }

  function removeAttachment(url: string) {
    onAttachmentsChange(attachments.filter((a) => a.url !== url));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
          className="text-[10px] uppercase tracking-widest border border-zinc-700 px-3 py-1.5 hover:bg-white hover:text-black transition-all disabled:opacity-50">
          {uploadingImage ? "Lädt hoch..." : "🖼 Bild einfügen"}
        </button>
        <button type="button" onClick={() => attachmentInputRef.current?.click()} disabled={uploadingAttachment}
          className="text-[10px] uppercase tracking-widest border border-zinc-700 px-3 py-1.5 hover:bg-white hover:text-black transition-all disabled:opacity-50">
          {uploadingAttachment ? "Lädt hoch..." : "📎 Anhang hinzufügen"}
        </button>
        <button type="button" onClick={() => setPreview((p) => !p)}
          className="text-[10px] uppercase tracking-widest border border-zinc-700 px-3 py-1.5 hover:bg-white hover:text-black transition-all">
          {preview ? "Bearbeiten" : "Vorschau"}
        </button>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        <input ref={attachmentInputRef} type="file" className="hidden" onChange={handleAttachmentSelect} />
      </div>

      {error && <p className="text-[10px] text-red-500 uppercase tracking-widest">{error}</p>}

      {preview ? (
        <div className="w-full min-h-[160px] bg-white text-black border border-zinc-700 p-4 text-sm overflow-auto"
          dangerouslySetInnerHTML={{ __html: value || "<p style='color:#999'>Keine Vorschau vorhanden.</p>" }} />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Freier HTML-Inhalt - Bilder über den Button oben einfügen, Text/Links/Formatierung direkt als HTML schreiben."}
          rows={8}
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs text-white placeholder:text-zinc-600 font-mono resize-y"
        />
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((a) => (
            <span key={a.url} className="flex items-center gap-2 text-[10px] border border-zinc-700 px-2 py-1 text-zinc-300">
              📎 {a.name}
              <button type="button" onClick={() => removeAttachment(a.url)} className="text-red-500 hover:text-red-400">✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
