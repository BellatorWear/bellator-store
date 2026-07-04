"use client";
import { useState, useMemo } from "react";

type LogEntry = {
  id: number;
  to: string;
  subject: string;
  source: string;
  sentAt: Date | null;
};

const SOURCE_LABELS: Record<string, string> = {
  newsletter: "Newsletter",
  reward: "Prämie",
  verification: "Bestätigung",
  news: "News-Channel",
  reminder: "Erinnerung",
};

export default function EmailLogViewer({ emails }: { emails: LogEntry[] }) {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const sources = Array.from(new Set(emails.map(e => e.source)));

  const filtered = useMemo(() => {
    return emails.filter(e => {
      if (sourceFilter && e.source !== sourceFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return e.to.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q);
      }
      return true;
    });
  }, [emails, query, sourceFilter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Suche (Email, Betreff)..."
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs text-white placeholder:text-zinc-600" />
        </div>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 p-2 text-xs text-white">
          <option value="">Alle Quellen</option>
          {sources.map(s => <option key={s} value={s}>{SOURCE_LABELS[s] ?? s}</option>)}
        </select>
      </div>

      <p className="text-[9px] text-zinc-600 uppercase tracking-widest">{filtered.length} / {emails.length} Emails</p>

      <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-zinc-600 p-4 border border-zinc-800">Keine Emails gefunden.</p>
        ) : filtered.map(e => (
          <div key={e.id} className="border border-zinc-800 bg-zinc-950">
            <button onClick={() => setExpanded(expanded === e.id ? null : e.id)}
              className="w-full text-left p-3 flex flex-wrap gap-x-4 gap-y-1 hover:bg-zinc-900 transition">
              <span className="text-[10px] border border-zinc-700 px-1.5 py-0.5 text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                {SOURCE_LABELS[e.source] ?? e.source}
              </span>
              <span className="text-xs text-zinc-300 font-bold flex-1 min-w-[120px]">{e.subject}</span>
              <span className="text-[10px] text-zinc-500">{e.to}</span>
              <span className="text-[10px] text-zinc-600 ml-auto whitespace-nowrap">
                {new Date(e.sentAt ?? Date.now()).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
