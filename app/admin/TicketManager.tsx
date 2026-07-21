"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getTicketBorderColor, isTicketUrgent, TICKET_STATUS_LABEL } from "@/app/tickets/display";

export type TicketListItem = {
  id: number;
  title: string;
  category: string | null;
  status: string | null;
  priority: string | null;
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
            className={`px-3 py-2 text-[10px] uppercase tracking-widest border transition-all ${filter === value ? "bg-white text-black border-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
          >
            {value === "all" ? "Alle" : TICKET_STATUS_LABEL[value] ?? value}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((ticket) => {
          const borderColor = getTicketBorderColor(ticket);
          return (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="block border-2 rounded-none p-4 bg-zinc-950/70 hover:bg-zinc-900/70 transition-all"
              style={{ borderColor }}
            >
              <div className="flex justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                    {ticket.category}
                  </p>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    {ticket.title}
                    {isTicketUrgent(ticket) && ticket.status !== "pending" && (
                      <span className="text-[9px] border border-red-500 text-red-500 px-1.5 py-0.5 uppercase tracking-widest">
                        Wichtig
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    User #{ticket.userId ?? "—"}
                  </p>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <p style={{ color: borderColor }} className="font-bold uppercase tracking-widest text-[10px]">
                    {TICKET_STATUS_LABEL[ticket.status ?? ""] ?? ticket.status}
                  </p>
                  <p>
                    {ticket.updatedAt
                      ? new Date(ticket.updatedAt).toLocaleString("de-DE")
                      : "—"}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="border border-zinc-800 p-6 text-sm text-zinc-500 text-center">
            Keine Tickets in dieser Ansicht.
          </div>
        )}
      </div>
    </div>
  );
}
