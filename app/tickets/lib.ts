import { db } from "@/db";
import { supportTickets, supportTicketMessages, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export type TicketCategory = "support" | "development" | "contact";

export const TICKET_CATEGORIES: Array<{
  value: TicketCategory;
  label: string;
  description: string;
}> = [
  {
    value: "support",
    label: "Support",
    description:
      "Allgemeine Hilfe, Bestellungen, Zugang oder technische Probleme",
  },
  {
    value: "development",
    label: "Development",
    description: "Produkt- oder Website-Entwicklung, Bugs und Verbesserungen",
  },
  {
    value: "contact",
    label: "Kontakt",
    description: "Allgemeine Anfragen oder sonstige Anliegen",
  },
];

function normalizeRoleValue(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function roleMatchesCategory(
  roleName: string | null | undefined,
  category: string,
) {
  const normalizedRole = normalizeRoleValue(roleName);
  if (!normalizedRole) return false;
  const categoryKey = normalizeRoleValue(category);
  if (!categoryKey) return false;
  const aliases: Record<string, string[]> = {
    support: ["support", "supportteam", "hilfe"],
    development: ["development", "developer", "dev", "technik", "engineering"],
    contact: ["contact", "kontakt", "community", "management"],
  };
  return (
    aliases[categoryKey]?.some((alias) => normalizedRole.includes(alias)) ??
    false
  );
}

export function canAccessTicket(
  user: { id: number; isAdmin?: boolean | null; role?: string | null } | null,
  ticket: { userId: number | null; category: string | null },
) {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (ticket.userId === user.id) return true;
  return roleMatchesCategory(user.role, ticket.category ?? "");
}

export async function getVisibleTicketsForUser(
  user: { id: number; isAdmin?: boolean | null; role?: string | null } | null,
) {
  if (!user) return [];
  const rows = await db
    .select()
    .from(supportTickets)
    .orderBy(desc(supportTickets.updatedAt), desc(supportTickets.createdAt));
  if (user.isAdmin) return rows;
  return rows.filter((ticket) => canAccessTicket(user, ticket));
}

export async function getTicketWithMessages(id: number) {
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, id));
  if (!ticket) return null;
  const messages = await db
    .select()
    .from(supportTicketMessages)
    .where(eq(supportTicketMessages.ticketId, id))
    .orderBy(desc(supportTicketMessages.createdAt));
  const author = ticket.userId
    ? await db
        .select({ id: users.id, username: users.username, email: users.email })
        .from(users)
        .where(eq(users.id, ticket.userId))
        .limit(1)
    : [];
  return { ticket, messages, author: author[0] ?? null };
}

export async function getTicketsForStaff(
  user: { id: number; isAdmin?: boolean | null; role?: string | null } | null,
) {
  if (!user) return [];
  if (user.isAdmin) {
    return await db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.updatedAt), desc(supportTickets.createdAt));
  }
  const rows = await db
    .select()
    .from(supportTickets)
    .orderBy(desc(supportTickets.updatedAt), desc(supportTickets.createdAt));
  return rows.filter((ticket) => canAccessTicket(user, ticket));
}
