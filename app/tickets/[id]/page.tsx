import Link from "next/link";
import { redirect } from "next/navigation";
import { addTicketReply, setTicketStatus } from "../actions";
import { canAccessTicket, getTicketWithMessages } from "../lib";
import { getCurrentUser } from "@/app/actions";
import GlobalHeader from "@/app/components/GlobalHeader";
import GlobalFooter from "@/app/components/GlobalFooter";

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

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-mono">
      <GlobalHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">
              Ticket #{ticket.id}
            </p>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              {ticket.title}
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Kategorie: {ticket.category} • Status: {ticket.status}
            </p>
          </div>
          <Link
            href="/tickets"
            className="border border-zinc-700 px-3 py-2 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            ← Zurück
          </Link>
        </div>

        <div className="border border-zinc-800 rounded-none p-4 bg-zinc-950/70 space-y-4">
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">
            {ticket.description}
          </p>
          {ticketAttachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                Anhänge
              </p>
              <ul className="space-y-2">
                {ticketAttachments.map((attachment) => (
                  <li key={attachment.url}>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-sm text-blue-400 underline"
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
            className="flex gap-3 flex-wrap border border-zinc-800 p-4 rounded-none bg-zinc-950/70"
          >
            <input type="hidden" name="ticketId" value={ticket.id} />
            <select
              name="status"
              defaultValue={ticket.status}
              className="bg-black border border-zinc-800 px-3 py-2 text-sm"
            >
              <option value="open">Offen</option>
              <option value="pending">In Bearbeitung</option>
              <option value="closed">Geschlossen</option>
            </select>
            <button
              type="submit"
              className="bg-white text-black px-4 py-2 text-xs uppercase tracking-widest font-black"
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
                className={`border rounded-none p-4 ${message.isInternal ? "border-purple-800 bg-purple-950/20" : "border-zinc-800 bg-zinc-950/70"}`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap text-xs uppercase tracking-widest text-zinc-500">
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
                      <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                        Anhänge
                      </p>
                      <ul className="space-y-2">
                        {messageAttachments.map((attachment) => (
                          <li key={attachment.url}>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block text-sm text-blue-400 underline"
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
          className="border border-zinc-800 rounded-none p-4 bg-zinc-950/70 space-y-3"
        >
          <input type="hidden" name="ticketId" value={ticket.id} />
          <label className="text-[10px] uppercase tracking-widest text-zinc-500">
            Antwort
          </label>
          <textarea
            name="body"
            rows={4}
            required
            className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm"
            placeholder="Schreibe eine Antwort an das Team oder den User..."
          />
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500">
              Bilder / Dateien (optional)
            </label>
            <label
              htmlFor={`ticket-reply-attachments-${ticket.id}`}
              className="inline-flex cursor-pointer items-center justify-center border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs uppercase tracking-widest font-black text-white hover:bg-white hover:text-black transition-all"
            >
              Dateien auswählen
            </label>
            <input
              id={`ticket-reply-attachments-${ticket.id}`}
              type="file"
              name="attachments"
              multiple
              accept="image/*,.pdf,.txt,.zip,.doc,.docx,.ppt,.pptx,.xlsx"
              className="hidden"
            />
          </div>
          <button
            type="submit"
            className="bg-white text-black px-4 py-2 text-xs uppercase tracking-widest font-black"
          >
            Antwort senden
          </button>
        </form>
      </main>
      <GlobalFooter />
    </div>
  );
}
