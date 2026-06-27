"use client";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Löschen",
  cancelLabel = "Abbrechen",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm t-card border-[3px] border-red-800 p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={`text-lg font-black uppercase tracking-tighter mb-3 ${danger ? "text-red-500" : "t-text"}`}>
          {title}
        </h2>
        <p className="text-xs t-muted uppercase tracking-widest leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border t-border py-2.5 text-[10px] uppercase tracking-widest font-bold t-text hover:bg-white hover:text-black transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 border-[2px] border-red-700 text-red-500 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
