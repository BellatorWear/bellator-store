"use client";

import { useEffect, useRef, useState } from "react";

type PreviewFile = {
  file: File;
  previewUrl?: string;
};

type AttachmentPickerWithPreviewProps = {
  id: string;
  name?: string;
  accept?: string;
  buttonLabel?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export default function AttachmentPickerWithPreview({
  id,
  name = "attachments",
  accept = "image/*,.pdf,.txt,.zip,.doc,.docx,.ppt,.pptx,.xlsx",
  buttonLabel = "Dateien auswählen",
}: AttachmentPickerWithPreviewProps) {
  const [selectedFiles, setSelectedFiles] = useState<PreviewFile[]>([]);
  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;

    const nextItems = files.map((file) => {
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;

      if (previewUrl) {
        previewUrlsRef.current.push(previewUrl);
      }

      return {
        file,
        previewUrl,
      };
    });

    setSelectedFiles((prev) => {
      const seen = new Set(
        prev.map(
          (item) =>
            `${item.file.name}-${item.file.size}-${item.file.lastModified}`,
        ),
      );
      const unique = nextItems.filter(
        (item) =>
          !seen.has(
            `${item.file.name}-${item.file.size}-${item.file.lastModified}`,
          ),
      );
      return [...prev, ...unique];
    });
  }

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <label className="text-[10px] uppercase tracking-widest text-zinc-500">
        Bilder / Dateien (optional)
      </label>
      <label
        htmlFor={id}
        className="group inline-flex cursor-pointer items-center justify-center border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs uppercase tracking-widest font-black text-white transition-all duration-200 hover:border-white hover:bg-white hover:text-black active:scale-[0.98] active:bg-zinc-200"
      >
        <span className="transition-all duration-200 group-hover:translate-x-[1px] group-active:translate-x-0">
          {buttonLabel}
        </span>
      </label>
      <input
        id={id}
        type="file"
        name={name}
        multiple
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />

      {selectedFiles.length > 0 && (
        <div className="w-full rounded-none border border-zinc-800 bg-black/40 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            Ausgewählt
          </p>
          <div className="space-y-2">
            {selectedFiles.map((item, index) => {
              const isImage = item.file.type.startsWith("image/");
              return (
                <div
                  key={`${item.file.name}-${index}`}
                  className="flex items-center gap-3 rounded-none border border-zinc-800 bg-zinc-950/70 p-2"
                >
                  {isImage && item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="h-12 w-12 rounded-none object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center border border-zinc-700 bg-zinc-900 text-lg text-zinc-400">
                      📎
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">
                      {item.file.name}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                      {formatBytes(item.file.size)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
