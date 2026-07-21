import Link from "next/link";
import { redirect } from "next/navigation";
import { addTicketReply, setTicketStatus, setTicketPriority } from "../actions";
import { canAccessTicket, getTicketWithMessages, TICKET_CATEGORIES } from "../lib";
import { getTicketBorderColor, isTicketUrgent, TICKET_STATUS_LABEL } from "../display";
import { getCurrentUser } from "@/app/actions";
import GlobalHeader from "@/app/components/GlobalHeader";
import GlobalFooter from "@/app/components/GlobalFooter";
import AttachmentPickerWithPreview from "@/app/components/AttachmentPickerWithPreview";

type TicketAttachment = { url: string; name: string; type: string };

function parseTicketAttachments(payload: string | null): TicketAttachment[] {
  if (!payload) return [];
  const trimmed = payload.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is TicketAttachment =>
          !!item &&
          typeof item === "object" &&
          typeof item.url === "string" &&
          typeof item.name === "string",
      );
    }
  } catch {
    // Fallback für ältere Single-URL-Werte.
  }

  if (trimmed.startsWith("https://")) {
    return [{ url: trimmed, name: "Anhang", type: "application/octet-stream" }];
  }

  return [];
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ticketId = Number(id);
  const data = await getTicketWithMessages(ticketId);
  if (!data?.ticket) redirect("/tickets");
  if (!canAccessTicket(user, data.ticket)) redirect("/tickets");

  const { ticket, messages, author } = data;
  const ticketAttachments = parseTicketAttachments(ticket.attachmentUrl);
  const borderColor = getTicketBorderColor(ticket);
  const isOwner = ticket.userId === user.id;

  return (
    <div className="min-h-screen flex flex-col font-mono t-text site-bg">
      <div className="relative z-10 flex flex-col min-h-screen t-invert">
        <GlobalHeader />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-5">
          <div className="t-card border-2 p-4" style={{ borderColor }}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] t-muted">
                  Ticket #{ticket.id}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter flex items-center gap-2 flex-wrap">
                  {ticket.title}
                  {isTicketUrgent(ticket) && ticket.status !== "pending" && (
                    <span className="text-[9px] border border-red-500 text-red-500 px-1.5 py-0.5 uppercase tracking-widest">
                      Wichtig
                    </span>
                  )}
                </h1>
                <p className="text-xs t-muted mt-2">
                  {TICKET_CATEGORIES.find((c) => c.value === ticket.category)?.label ?? ticket.category}
                  {" · "}
                  <span style={{ color: borderColor }} className="font-bold">
                    {TICKET_STATUS_LABEL[ticket.status ?? ""] ?? ticket.status}
                  </span>
                </p>
              </div>
              <Link
                href="/tickets"
                className="border t-border px-3 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-200 active:scale-[0.97] shrink-0"
              >
                ← Zurück
              </Link>
            </div>
          </div>

          {isOwner && (
            <form action={setTicketPriority} className="flex items-center gap-3 flex-wrap">
              <input type="hidden" name="ticketId" value={ticket.id} />
              <input type="hidden" name="priority" value={isTicketUrgent(ticket) ? "normal" : "urgent"} />
              <button
                type="submit"
                className={`border px-3 py-2 text-[10px] uppercase tracking-widest font-bold transition-all duration-200 active:scale-[0.97] ${
                  isTicketUrgent(ticket)
                    ? "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    : "t-border t-muted hover:border-red-500 hover:text-red-500"
                }`}
              >
                {isTicketUrgent(ticket) ? "✕ Nicht mehr wichtig" : "Als wichtig markieren"}
              </button>
            </form>
          )}

          <div className="t-card border p-4 space-y-4">
            <p className="text-sm t-muted whitespace-pre-wrap">
              {ticket.description}
            </p>
            {ticketAttachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] t-muted">
                  Anhänge
                </p>
                <ul className="space-y-2">
                  {ticketAttachments.map((attachment) => (
                    <li key={attachment.url}>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-sm text-blue-400 underline hover:text-blue-300 transition"
                      >
                        {attachment.name || "Anhang öffnen"}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {user.isAdmin && (
            <form
              action={setTicketStatus}
              className="t-card border p-4 flex gap-3 flex-wrap items-center"
            >
              <input type="hidden" name="ticketId" value={ticket.id} />
              <select
                name="status"
                defaultValue={ticket.status ?? "open"}
                className="t-input border px-3 py-2 text-sm outline-none transition"
              >
                <option value="open">Offen</option>
                <option value="pending">In Bearbeitung</option>
                <option value="closed">Geschlossen</option>
              </select>
              <button
                type="submit"
                className="t-btn-primary px-4 py-2 text-xs uppercase tracking-widest font-black transition-all duration-200 active:scale-[0.97]"
              >
                Status speichern
              </button>
            </form>
          )}

          <div className="space-y-3">
            {messages
              .slice()
              .reverse()
              .map((message) => (
                <div
                  key={message.id}
                  className={`border p-4 ${message.isInternal ? "border-purple-800 bg-purple-950/20" : "t-card"}`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap text-xs uppercase tracking-widest t-muted">
                    <span>
                      {message.userId === user.id
                        ? "Du"
                        : message.isInternal
                          ? "Admin"
                          : author?.username || author?.email || "User"}
                    </span>
                    <span>
                      {message.createdAt
                        ? new Date(message.createdAt).toLocaleString("de-DE")
                        : "—"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm whitespace-pre-wrap">
                    {message.body}
                  </p>
                  {(() => {
                    const messageAttachments = parseTicketAttachments(
                      message.attachmentUrl,
                    );
                    return messageAttachments.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.3em] t-muted">
                          Anhänge
                        </p>
                        <ul className="space-y-2">
                          {messageAttachments.map((attachment) => (
                            <li key={attachment.url}>
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-sm text-blue-400 underline hover:text-blue-300 transition"
                              >
                                {attachment.name || "Anhang öffnen"}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null;
                  })()}
                </div>
              ))}
          </div>

          <form
            action={addTicketReply}
            className="t-card border p-4 space-y-3"
          >
            <input type="hidden" name="ticketId" value={ticket.id} />
            <label className="text-[10px] uppercase tracking-widest t-muted">
              Antwort
            </label>
            <textarea
              name="body"
              rows={4}
              required
              className="w-full t-input border px-3 py-2 text-sm outline-none transition"
              placeholder="Schreibe eine Antwort an das Team oder den User..."
            />
            <AttachmentPickerWithPreview
              id={`ticket-reply-attachments-${ticket.id}`}
              name="attachments"
            />
            <button
              type="submit"
              className="t-btn-primary px-4 py-2 text-xs uppercase tracking-widest font-black transition-all duration-200 active:scale-[0.97]"
            >
              Antwort senden
            </button>
          </form>
        </main>
        <GlobalFooter />
      </div>
    </div>
  );
}
