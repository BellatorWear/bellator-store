import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { getVisibleTicketsForUser, TICKET_CATEGORIES } from "./lib";
import { getTicketBorderColor, isTicketUrgent, TICKET_STATUS_LABEL } from "./display";
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
    <div className="min-h-screen flex flex-col font-mono t-text site-bg">
      <div className="relative z-10 flex flex-col min-h-screen t-invert">
        <GlobalHeader />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-6">
          <div className="t-card border p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] t-muted">
                Private Tickets
              </p>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">
                Support & Entwicklung
              </h1>
              <p className="text-xs t-muted mt-2 max-w-md">
                Alle Tickets sind privat und nur für dich und die betroffenen Rollen sichtbar.
              </p>
            </div>
            <Link
              href="/profil"
              className="border t-border px-3 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-200 active:scale-[0.97] shrink-0"
            >
              Zum Profil
            </Link>
          </div>

          <form action={createTicket} className="t-card border p-5 sm:p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest t-muted">Neues Ticket</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest t-muted">
                  Titel
                </label>
                <input
                  name="title"
                  required
                  className="w-full t-input border px-3 py-2 text-sm outline-none transition"
                  placeholder="Kurzbeschreibung des Problems"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest t-muted">
                  Kategorie
                </label>
                <select
                  name="category"
                  defaultValue="support"
                  className="w-full t-input border px-3 py-2 text-sm outline-none transition"
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
              <label className="text-[10px] uppercase tracking-widest t-muted">
                Beschreibung
              </label>
              <textarea
                name="message"
                required
                rows={6}
                className="w-full t-input border px-3 py-2 text-sm outline-none transition"
                placeholder="Beschreibe das Problem, den Fehler oder die Anfrage so konkret wie möglich."
              />
            </div>
            <AttachmentPickerWithPreview
              id="ticket-attachments"
              name="attachments"
            />
            <label className="flex items-center gap-2 text-xs t-muted cursor-pointer w-fit">
              <input type="checkbox" name="important" className="accent-red-500 w-4 h-4" />
              <span>
                Als <span className="text-red-500 font-bold">wichtig</span> markieren (dringend, blockierend o.ä.)
              </span>
            </label>
            <button
              type="submit"
              className="t-btn-primary px-5 py-2.5 text-xs uppercase tracking-widest font-black transition-all duration-200 active:scale-[0.97]"
            >
              Ticket eröffnen
            </button>
          </form>

          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest t-muted px-1">
              Deine Tickets
            </h2>
            {tickets.length === 0 ? (
              <div className="t-card border p-6 text-sm t-muted text-center">
                Noch keine Tickets eröffnet.
              </div>
            ) : (
              tickets.map((ticket) => {
                const borderColor = getTicketBorderColor(ticket);
                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="block t-card border-2 p-4 hover:bg-white/5 transition-all duration-200 active:scale-[0.99]"
                    style={{ borderColor }}
                  >
                    <div className="flex justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] t-muted">
                          {TICKET_CATEGORIES.find((c) => c.value === ticket.category)?.label ?? ticket.category}
                        </p>
                        <h3 className="font-bold flex items-center gap-2">
                          {ticket.title}
                          {isTicketUrgent(ticket) && ticket.status !== "pending" && (
                            <span className="text-[9px] border border-red-500 text-red-500 px-1.5 py-0.5 uppercase tracking-widest">
                              Wichtig
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="text-right text-xs t-muted">
                        <p style={{ color: borderColor }} className="font-bold uppercase tracking-widest text-[10px]">
                          {TICKET_STATUS_LABEL[ticket.status ?? ""] ?? ticket.status}
                        </p>
                        <p>
                          {ticket.createdAt
                            ? new Date(ticket.createdAt).toLocaleString("de-DE")
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </main>
        <GlobalFooter />
      </div>
    </div>
  );
}
