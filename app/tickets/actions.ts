"use server";

import { db } from "@/db";
import { supportTickets, supportTicketMessages } from "@/db/schema";
import { getCurrentUser } from "@/app/actions";
import { put } from "@vercel/blob";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { canAccessTicket, TICKET_CATEGORIES, type TicketCategory } from "./lib";

type TicketAttachment = { url: string; name: string; type: string };

function getUserOrThrow() {
  return getCurrentUser();
}

function serializeAttachments(attachments: TicketAttachment[]): string | null {
  if (attachments.length === 0) return null;
  return JSON.stringify(attachments);
}

export async function createTicket(formData: FormData): Promise<void> {
  const user = await getUserOrThrow();
  if (!user) {
    console.error(
      "Ticket-Erstellung fehlgeschlagen: Benutzer nicht eingeloggt.",
    );
    return;
  }

  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "") as TicketCategory;
  const message = String(formData.get("message") || "").trim();
  const priority = formData.get("important") === "on" ? "urgent" : "normal";
  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File);

  if (!title || !message) {
    console.error(
      "Ticket-Erstellung fehlgeschlagen: Titel oder Nachricht fehlt.",
    );
    return;
  }
  if (!TICKET_CATEGORIES.some((entry) => entry.value === category)) {
    console.error("Ticket-Erstellung fehlgeschlagen: Ungültige Kategorie.");
    return;
  }

  let attachmentPayload: string | null = null;
  const attachments: TicketAttachment[] = [];

  for (const file of files) {
    if (file.size > 4 * 1024 * 1024) {
      console.error("Ticket-Erstellung fehlgeschlagen: Datei zu groß.");
      return;
    }
    if (!process.env.BLOB2_READ_WRITE_TOKEN) {
      console.error(
        "Ticket-Erstellung fehlgeschlagen: Blob-Upload nicht konfiguriert.",
      );
      return;
    }
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB2_READ_WRITE_TOKEN,
    });
    attachments.push({
      url: blob.url,
      name: file.name,
      type: file.type || "application/octet-stream",
    });
  }

  attachmentPayload = serializeAttachments(attachments);

  const [ticket] = await db
    .insert(supportTickets)
    .values({
      userId: user.id,
      title,
      category,
      status: "open",
      priority,
      description: message,
      attachmentUrl: attachmentPayload,
      attachmentName: null,
      attachmentType: null,
    })
    .returning();

  if (ticket) {
    await db.insert(supportTicketMessages).values({
      ticketId: ticket.id,
      userId: user.id,
      body: message,
      attachmentUrl: attachmentPayload,
      attachmentName: null,
      attachmentType: null,
      isInternal: false,
    });
  }

  revalidatePath("/tickets");
  revalidatePath("/admin");
}

export async function addTicketReply(formData: FormData): Promise<void> {
  const user = await getUserOrThrow();
  if (!user) {
    console.error("Ticket-Antwort fehlgeschlagen: Benutzer nicht eingeloggt.");
    return;
  }

  const ticketId = Number(formData.get("ticketId") || 0);
  const body = String(formData.get("body") || "").trim();
  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File);

  if (!ticketId || !body) {
    console.error("Ticket-Antwort fehlgeschlagen: Nachricht fehlt.");
    return;
  }

  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));
  if (!ticket) {
    console.error("Ticket-Antwort fehlgeschlagen: Ticket nicht gefunden.");
    return;
  }
  if (!canAccessTicket(user, ticket)) {
    console.error("Ticket-Antwort fehlgeschlagen: Keine Berechtigung.");
    return;
  }

  let attachmentPayload: string | null = null;
  const attachments: TicketAttachment[] = [];

  for (const file of files) {
    if (file.size > 4 * 1024 * 1024) {
      console.error("Ticket-Antwort fehlgeschlagen: Datei zu groß.");
      return;
    }
    if (!process.env.BLOB2_READ_WRITE_TOKEN) {
      console.error(
        "Ticket-Antwort fehlgeschlagen: Blob-Upload nicht konfiguriert.",
      );
      return;
    }
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB2_READ_WRITE_TOKEN,
    });
    attachments.push({
      url: blob.url,
      name: file.name,
      type: file.type || "application/octet-stream",
    });
  }

  attachmentPayload = serializeAttachments(attachments);

  await db.insert(supportTicketMessages).values({
    ticketId,
    userId: user.id,
    body,
    attachmentUrl: attachmentPayload,
    attachmentName: null,
    attachmentType: null,
    isInternal: user.isAdmin || false,
  });

  await db
    .update(supportTickets)
    .set({
      status: ticket.status === "closed" ? "closed" : "open",
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, ticketId));

  revalidatePath("/tickets");
  revalidatePath("/admin");
}

export async function setTicketPriority(formData: FormData): Promise<void> {
  const user = await getUserOrThrow();
  if (!user) {
    console.error("Prioritätsänderung fehlgeschlagen: Benutzer nicht eingeloggt.");
    return;
  }

  const ticketId = Number(formData.get("ticketId") || 0);
  const priority = String(formData.get("priority") || "normal");
  if (!ticketId || (priority !== "normal" && priority !== "urgent")) {
    console.error("Prioritätsänderung fehlgeschlagen: Ungültige Eingabe.");
    return;
  }

  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));
  if (!ticket) {
    console.error("Prioritätsänderung fehlgeschlagen: Ticket nicht gefunden.");
    return;
  }
  // Nur der Ersteller markiert sein eigenes Ticket als wichtig - das ist
  // eine Einschätzung des Users, kein Team-Werkzeug (das Team hat dafür
  // den Status wie "In Bearbeitung").
  if (ticket.userId !== user.id) {
    console.error("Prioritätsänderung fehlgeschlagen: Keine Berechtigung.");
    return;
  }

  await db
    .update(supportTickets)
    .set({ priority, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/admin");
}

export async function setTicketStatus(formData: FormData): Promise<void> {
  const user = await getUserOrThrow();
  if (!user?.isAdmin) {
    console.error(
      "Ticket-Statusänderung fehlgeschlagen: Keine Admin-Berechtigung.",
    );
    return;
  }

  const ticketId = Number(formData.get("ticketId") || 0);
  const status = String(formData.get("status") || "open");
  if (!ticketId) {
    console.error("Ticket-Statusänderung fehlgeschlagen: Ungültiges Ticket.");
    return;
  }

  await db
    .update(supportTickets)
    .set({ status, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));
  revalidatePath("/tickets");
  revalidatePath("/admin");
}

export async function getTicketMessagesServer(ticketId: number) {
  const user = await getUserOrThrow();
  if (!user) return { success: false, error: "Bitte einloggen." };
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));
  if (!ticket) return { success: false, error: "Ticket nicht gefunden." };
  if (!canAccessTicket(user, ticket))
    return { success: false, error: "Keine Berechtigung." };
  const messages = await db
    .select()
    .from(supportTicketMessages)
    .where(eq(supportTicketMessages.ticketId, ticketId))
    .orderBy(desc(supportTicketMessages.createdAt));
  return { success: true, messages };
}
