"use client";
import { useState, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

export type AdminFunctionItem = {
  id: string;
  title: string;
  description: string;
  keywords?: string[];
  content: React.ReactNode;
  defaultOpen?: boolean;
};
export type AdminFunctionGroup = {
  title: string;
  items: AdminFunctionItem[];
};

export default function AdminDashboard({ groups }: { groups: AdminFunctionGroup[] }) {
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(groups.flatMap((g) => g.items.filter((i) => i.defaultOpen).map((i) => i.id))),
  );

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const normalizedQuery = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          const haystack = [item.title, item.description, ...(item.keywords ?? [])].join(" ").toLowerCase();
          return haystack.includes(normalizedQuery);
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, normalizedQuery]);

  return (
    <div className="space-y-8">
      {/* Funktions-Suche */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Funktion suchen... (z.B. 'User', 'Produkt', 'News')"
          className="w-full bg-zinc-900 border border-zinc-700 p-3 pl-10 text-sm text-white placeholder:text-zinc-600 focus:border-white outline-none transition"
        />
      </div>

      {filteredGroups.length === 0 && (
        <p className="text-xs text-zinc-600 uppercase tracking-widest text-center py-8">
          Keine Funktion gefunden für &quot;{query}&quot;.
        </p>
      )}

      {filteredGroups.map((group) => (
        <div key={group.title} className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 border-b border-zinc-800 pb-2">
            {group.title}
          </h2>
          <div className="space-y-2">
            {group.items.map((item) => {
              const isOpen = openIds.has(item.id);
              return (
                <div key={item.id} className="border border-zinc-700">
                  <button
                    onClick={() => toggle(item.id)}
                    className="w-full flex items-center justify-between gap-3 p-3.5 text-left hover:bg-zinc-900/60 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-white">{item.title}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.description}</p>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-zinc-800 p-4 sm:p-5">
                      {item.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
