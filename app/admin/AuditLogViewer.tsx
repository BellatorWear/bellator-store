"use client";
import { useState, useMemo } from "react";

type AuditEntry = {
  id: number;
  actorLabel: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: unknown;
  createdAt: Date | string | null;
};

function toCsv(entries: AuditEntry[]): string {
  const header = ["id", "createdAt", "actorLabel", "action", "targetType", "targetId", "details"];
  const rows = entries.map((e) => [
    e.id,
    e.createdAt ? new Date(e.createdAt).toISOString() : "",
    e.actorLabel,
    e.action,
    e.targetType ?? "",
    e.targetId ?? "",
    e.details ? JSON.stringify(e.details).replace(/"/g, '""') : "",
  ]);
  const escape = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  return [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AuditLogViewer({ entries }: { entries: AuditEntry[] }) {
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const actions = useMemo(() => Array.from(new Set(entries.map((e) => e.action))).sort(), [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (actionFilter && e.action !== actionFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          e.actorLabel.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          (e.targetId ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, query, actionFilter]);

  const dateStamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche (Person, Aktion, Ziel-ID)..."
          className="flex-1 min-w-[180px] bg-zinc-900 border border-zinc-700 p-2 text-xs text-white placeholder:text-zinc-600"
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 p-2 text-xs text-white"
        >
          <option value="">Alle Aktionen</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => download(`audit-log-${dateStamp}.csv`, toCsv(filtered), "text/csv")}
          className="border border-zinc-600 px-3 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all"
        >
          CSV herunterladen
        </button>
        <button
          type="button"
          onClick={() => download(`audit-log-${dateStamp}.json`, JSON.stringify(filtered, null, 2), "application/json")}
          className="border border-zinc-600 px-3 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all"
        >
          JSON herunterladen
        </button>
      </div>

      <p className="text-[9px] text-zinc-600 uppercase tracking-widest">
        {filtered.length} / {entries.length} Einträge (letzte {entries.length})
      </p>

      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-zinc-600 p-4 border border-zinc-800">Keine Einträge gefunden.</p>
        ) : (
          filtered.map((e) => (
            <div key={e.id} className="border border-zinc-800 bg-zinc-950 p-2.5 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{e.action}</span>
                <span className="text-[9px] text-zinc-600">
                  {e.createdAt ? new Date(e.createdAt).toLocaleString("de-DE") : "—"}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                {e.actorLabel}
                {e.targetType && (
                  <span className="text-zinc-600"> → {e.targetType} #{e.targetId}</span>
                )}
              </p>
              {e.details != null && (
                <pre className="text-[9px] text-zinc-600 mt-1.5 whitespace-pre-wrap break-all">
                  {JSON.stringify(e.details)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
