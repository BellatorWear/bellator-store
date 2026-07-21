"use server";

import { db } from "@/db";
import { supportTickets, supportTicketMessages } from "@/db/schema";
import { getCurrentUser } from "@/app/actions";
import { put } from "@vercel/blob";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { canAccessTicket, TICKET_CATEGORIES, type TicketCategory } from "./lib";

function getUserOrThrow() {
  return getCurrentUser();
}

export async function createTicket(formData: FormData) {
  const user = await getUserOrThrow();
  if (!user) return { success: false, error: "Bitte zuerst einloggen." };

  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "") as TicketCategory;
  const message = String(formData.get("message") || "").trim();
  const file =
    formData.get("attachment") instanceof File
      ? (formData.get("attachment") as File)
      : null;

  if (!title || !message)
    return { success: false, error: "Titel und Nachricht sind erforderlich." };
  if (!TICKET_CATEGORIES.some((entry) => entry.value === category))
    return { success: false, error: "Ungültige Kategorie." };

  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;
  let attachmentType: string | null = null;

  if (file) {
    if (file.size > 4 * 1024 * 1024)
      return { success: false, error: "Datei zu groß. Maximal 4 MB." };
    if (!process.env.BLOB2_READ_WRITE_TOKEN)
      return {
        success: false,
        error: "Blob-Upload ist derzeit nicht konfiguriert.",
      };
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB2_READ_WRITE_TOKEN,
    });
    attachmentUrl = blob.url;
    attachmentName = file.name;
    attachmentType = file.type || "application/octet-stream";
  }

  const [ticket] = await db
    .insert(supportTickets)
    .values({
      userId: user.id,
      title,
      category,
      status: "open",
      priority: "normal",
      description: message,
      attachmentUrl,
      attachmentName,
      attachmentType,
    })
    .returning();

  if (ticket) {
    await db.insert(supportTicketMessages).values({
      ticketId: ticket.id,
      userId: user.id,
      body: message,
      attachmentUrl,
      attachmentName,
      attachmentType,
      isInternal: false,
    });
  }

  revalidatePath("/tickets");
  revalidatePath("/admin");
  return { success: true, ticketId: ticket?.id ?? null };
}

export async function addTicketReply(formData: FormData) {
  const user = await getUserOrThrow();
  if (!user) return { success: false, error: "Bitte zuerst einloggen." };

  const ticketId = Number(formData.get("ticketId") || 0);
  const body = String(formData.get("body") || "").trim();
  const file =
    formData.get("attachment") instanceof File
      ? (formData.get("attachment") as File)
      : null;

  if (!ticketId || !body)
    return { success: false, error: "Nachricht ist erforderlich." };

  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));
  if (!ticket) return { success: false, error: "Ticket nicht gefunden." };
  if (!canAccessTicket(user, ticket))
    return { success: false, error: "Keine Berechtigung." };

  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;
  let attachmentType: string | null = null;

  if (file) {
    if (file.size > 4 * 1024 * 1024)
      return { success: false, error: "Datei zu groß. Maximal 4 MB." };
    if (!process.env.BLOB2_READ_WRITE_TOKEN)
      return {
        success: false,
        error: "Blob-Upload ist derzeit nicht konfiguriert.",
      };
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB2_READ_WRITE_TOKEN,
    });
    attachmentUrl = blob.url;
    attachmentName = file.name;
    attachmentType = file.type || "application/octet-stream";
  }

  await db.insert(supportTicketMessages).values({
    ticketId,
    userId: user.id,
    body,
    attachmentUrl,
    attachmentName,
    attachmentType,
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
  return { success: true };
}

export async function setTicketStatus(formData: FormData) {
  const user = await getUserOrThrow();
  if (!user?.isAdmin)
    return { success: false, error: "Nur Admins können den Status ändern." };

  const ticketId = Number(formData.get("ticketId") || 0);
  const status = String(formData.get("status") || "open");
  if (!ticketId) return { success: false, error: "Ungültiges Ticket." };

  await db
    .update(supportTickets)
    .set({ status, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));
  revalidatePath("/tickets");
  revalidatePath("/admin");
  return { success: true };
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
