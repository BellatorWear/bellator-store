"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getTicketBorderColor, isTicketUrgent, TICKET_STATUS_LABEL } from "@/app/tickets/display";
import { deleteTicket } from "@/app/tickets/actions";

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

// Gleiches Bestätigungsdialog-Muster wie RoleManager/ReviewManager - noch
// keine geteilte Modal-Komponente im Projekt.
function ConfirmDeleteModal({
  message,
  loading,
  onConfirm,
  onCancel,
}: {
  message: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-black border-[2px] border-red-800 w-full max-w-sm p-6 font-mono" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-zinc-300 uppercase tracking-widest leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={loading}
            className="flex-1 border border-zinc-700 text-zinc-300 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50">
            Abbrechen
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className="flex-1 border-[2px] border-red-700 text-red-500 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 hover:text-white transition-all disabled:opacity-50">
            {loading ? "..." : "Löschen"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TicketManager({
  tickets: initialTickets,
}: {
  tickets: TicketListItem[];
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [filter, setFilter] = useState("all");
  const [deleting, setDeleting] = useState<TicketListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [err, setErr] = useState("");

  const filtered = useMemo(() => {
    if (filter === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === filter);
  }, [filter, tickets]);

  async function confirmDelete() {
    if (!deleting || deleteLoading) return;
    setDeleteLoading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("ticketId", String(deleting.id));
      const res = await deleteTicket(fd);
      if (res?.error) { setErr(res.error); return; }
      setTickets((prev) => prev.filter((t) => t.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      console.error("Ticket löschen fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setDeleteLoading(false);
    }
  }

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

      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}

      <div className="space-y-3">
        {filtered.map((ticket) => {
          const borderColor = getTicketBorderColor(ticket);
          return (
            <div key={ticket.id} className="relative group">
              <Link
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
                  <div className="text-right text-xs text-zinc-500 pr-16">
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
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setErr("");
                  setDeleting(ticket);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600 hover:text-red-500 transition uppercase tracking-widest"
              >
                Löschen
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="border border-zinc-800 p-6 text-sm text-zinc-500 text-center">
            Keine Tickets in dieser Ansicht.
          </div>
        )}
      </div>

      {deleting && (
        <ConfirmDeleteModal
          message={`Ticket "${deleting.title}" wirklich löschen? Alle Nachrichten und Anhänge werden mitgelöscht. Das kann nicht rückgängig gemacht werden.`}
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => { if (!deleteLoading) setDeleting(null); }}
        />
      )}
    </div>
  );
}
