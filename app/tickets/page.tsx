import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { getVisibleTicketsForUser, TICKET_CATEGORIES } from "./lib";
import Link from "next/link";
import { createTicket } from "./actions";
import GlobalHeader from "@/app/components/GlobalHeader";
import GlobalFooter from "@/app/components/GlobalFooter";
import AttachmentPickerWithPreview from "@/app/components/AttachmentPickerWithPreview";

export default async function TicketsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tickets = await getVisibleTicketsForUser(user);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-mono">
      <GlobalHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">
              Private Tickets
            </p>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Support & Entwicklung
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Alle Tickets sind privat und nur für die betroffenen Rollen bzw.
              den Ersteller sichtbar.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs uppercase tracking-widest text-zinc-300">
              <span className="block text-[10px] text-zinc-500">Profil</span>
              <span className="font-black text-white">
                {user.username || user.email}
              </span>
            </div>
            <Link
              href="/profil"
              className="border border-zinc-700 px-3 py-2 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Zum Profil
            </Link>
          </div>
        </div>

        <form
          action={createTicket}
          className="border border-zinc-800 rounded-none p-5 space-y-4 bg-zinc-950/70"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500">
                Titel
              </label>
              <input
                name="title"
                required
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm"
                placeholder="Kurzbeschreibung des Problems"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500">
                Kategorie
              </label>
              <select
                name="category"
                defaultValue="support"
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm"
              >
                {TICKET_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500">
              Beschreibung
            </label>
            <textarea
              name="message"
              required
              rows={6}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm"
              placeholder="Beschreibe das Problem, den Fehler oder die Anfrage so konkret wie möglich."
            />
          </div>
          <AttachmentPickerWithPreview
            id="ticket-attachments"
            name="attachments"
          />
          <button
            type="submit"
            className="bg-white text-black px-4 py-2 text-xs uppercase tracking-widest font-black"
          >
            Ticket eröffnen
          </button>
        </form>

        <div className="space-y-3">
          <h2 className="text-xl font-black uppercase tracking-tighter">
            Deine Tickets
          </h2>
          {tickets.length === 0 ? (
            <div className="border border-zinc-800 p-6 text-sm text-zinc-500">
              Noch keine Tickets eröffnet.
            </div>
          ) : (
            tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block border border-zinc-800 rounded-none p-4 bg-zinc-950/70 hover:border-zinc-600 transition-all"
              >
                <div className="flex justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                      {ticket.category}
                    </p>
                    <h3 className="font-bold text-white">{ticket.title}</h3>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    <p>{ticket.status}</p>
                    <p>
                      {ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleString("de-DE")
                        : "—"}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
      <GlobalFooter />
    </div>
  );
}
