"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type TicketListItem = {
  id: number;
  title: string;
  category: string | null;
  status: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  userId: number | null;
};

export default function TicketManager({
  tickets,
}: {
  tickets: TicketListItem[];
}) {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => {
    if (filter === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === filter);
  }, [filter, tickets]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", "open", "pending", "closed"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`px-3 py-2 text-[10px] uppercase tracking-widest border ${filter === value ? "bg-white text-black border-white" : "border-zinc-700 text-zinc-400"}`}
          >
            {value === "all" ? "Alle" : value}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/tickets/${ticket.id}`}
            className="block border border-zinc-800 rounded-xl p-4 bg-zinc-950/70 hover:border-zinc-600 transition-all"
          >
            <div className="flex justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                  {ticket.category}
                </p>
                <h3 className="font-bold text-white">{ticket.title}</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  User #{ticket.userId ?? "—"}
                </p>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <p>{ticket.status}</p>
                <p>
                  {ticket.updatedAt
                    ? new Date(ticket.updatedAt).toLocaleString("de-DE")
                    : "—"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
