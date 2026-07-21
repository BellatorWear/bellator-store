// Rein clientseitige Anzeige-Helfer (keine DB-Imports!) - lib.ts importiert
// db/schema serverseitig, das würde im "use client"-TicketManager sonst
// versehentlich Server-Code in den Client-Bundle ziehen.

export type TicketStatus = "open" | "pending" | "closed";
export type TicketPriority = "normal" | "urgent";

export const TICKET_STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  pending: "In Bearbeitung",
  closed: "Geschlossen",
};

/**
 * Rahmenfarbe für ein Ticket. Reihenfolge ist bewusst so:
 * "In Bearbeitung" sticht optisch am meisten hervor (braucht gerade
 * Aufmerksamkeit vom Team), danach "wichtig" (rot), sonst schlicht nach
 * offen/geschlossen.
 */
export function getTicketBorderColor(ticket: {
  status: string | null;
  priority: string | null;
}): string {
  if (ticket.status === "pending") return "#f97316"; // orange
  if (ticket.priority === "urgent") return "#ef4444"; // rot
  if (ticket.status === "closed") return "#3b82f6"; // blau
  return "#22c55e"; // grün (offen, normal)
}

export function isTicketUrgent(ticket: { priority: string | null }): boolean {
  return ticket.priority === "urgent";
}
