import Link from "next/link";
import { redirect } from "next/navigation";
import { addTicketReply, setTicketStatus } from "../actions";
import { canAccessTicket, getTicketWithMessages } from "../lib";
import { getCurrentUser } from "@/app/actions";

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

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
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

        <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/70 space-y-4">
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">
            {ticket.description}
          </p>
          {ticket.attachmentUrl && (
            <a
              href={ticket.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm text-blue-400 underline"
            >
              Anhang öffnen
            </a>
          )}
        </div>

        {user.isAdmin && (
          <form
            action={setTicketStatus}
            className="flex gap-3 flex-wrap border border-zinc-800 p-4 rounded-xl bg-zinc-950/70"
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
                className={`border rounded-xl p-4 ${message.isInternal ? "border-purple-800 bg-purple-950/20" : "border-zinc-800 bg-zinc-950/70"}`}
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
                {message.attachmentUrl && (
                  <a
                    href={message.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm text-blue-400 underline"
                  >
                    Anhang öffnen
                  </a>
                )}
              </div>
            ))}
        </div>

        <form
          action={addTicketReply}
          className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/70 space-y-3"
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
              Screenshot / Datei (optional)
            </label>
            <input
              type="file"
              name="attachment"
              accept="image/*,.pdf,.txt"
              className="w-full text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-white text-black px-4 py-2 text-xs uppercase tracking-widest font-black"
          >
            Antwort senden
          </button>
        </form>
      </div>
    </div>
  );
}
