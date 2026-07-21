"use server";

import { db } from "@/db";
import { users, chatChannels, chatChannelMembers, chatMessages } from "@/db/schema";
import { eq, and, inArray, desc, asc, ilike, ne } from "drizzle-orm";
import { getCurrentUser } from "@/app/actions";
import { isTrustedOrigin } from "@/app/utils/origin";
import { sanitizeText, isSuspiciousInput } from "@/app/utils/inputSafety";
import { getSetting } from "@/app/utils/settings";
import { CHAT_ROLE_ACCESS_KEY } from "@/app/utils/settings";
import { hasChatAccess, CHAT_ROLE_ACCESS_DEFAULT } from "@/app/admin/permissions";
import { getAllRoles, getRoleConfig } from "@/app/admin/roles";
import { getPusherServer, channelEventName, userEventName } from "@/lib/pusher";
import { sendPushToUser } from "@/app/utils/push";

const MAX_MESSAGE_LENGTH = 4000;

// Zentrale Zugriffsprüfung - wird von jeder Chat-Action zuerst aufgerufen.
// Nicht nur "eingeloggt" (das übernimmt schon proxy.ts), sondern
// zusätzlich der eigentliche Team-Chat-Zugriff (Rollen-Standard + Override).
async function requireChatUser() {
  if (!(await isTrustedOrigin())) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const roleDefaults = await getSetting(CHAT_ROLE_ACCESS_KEY, CHAT_ROLE_ACCESS_DEFAULT);
  if (!hasChatAccess(user, roleDefaults)) return null;
  return user;
}

async function isMember(channelId: number, userId: number): Promise<boolean> {
  const rows = await db
    .select()
    .from(chatChannelMembers)
    .where(and(eq(chatChannelMembers.channelId, channelId), eq(chatChannelMembers.userId, userId)));
  return rows.length > 0;
}

export type ChatChannelSummary = {
  id: number;
  type: "channel" | "dm";
  name: string | null;
  otherMember: { id: number; username: string | null; email: string } | null;
  lastMessage: { body: string; createdAt: Date | null; authorUsername: string | null } | null;
  unread: boolean;
};

// Liste aller Channels/DMs, in denen der eingeloggte User Mitglied ist -
// inkl. Vorschau der letzten Nachricht und einem einfachen Ungelesen-Flag
// (letzte Nachricht neuer als der eigene lastReadAt-Zeitstempel).
export async function listMyChannels(): Promise<ChatChannelSummary[]> {
  const user = await requireChatUser();
  if (!user) return [];

  const memberships = await db
    .select()
    .from(chatChannelMembers)
    .where(eq(chatChannelMembers.userId, user.id));
  if (memberships.length === 0) return [];

  const channelIds = memberships.map((m) => m.channelId);
  const channels = await db.select().from(chatChannels).where(inArray(chatChannels.id, channelIds));

  const allMembers = await db
    .select()
    .from(chatChannelMembers)
    .where(inArray(chatChannelMembers.channelId, channelIds));
  const memberUserIds = [...new Set(allMembers.map((m) => m.userId))];
  const memberUsers = memberUserIds.length
    ? await db.select({ id: users.id, username: users.username, email: users.email }).from(users).where(inArray(users.id, memberUserIds))
    : [];
  const userById = new Map(memberUsers.map((u) => [u.id, u]));

  // Letzte Nachricht pro Channel - bei überschaubarer Team-Chat-Größe reicht
  // ein einfacher Query pro Channel völlig aus, kein Grund für komplexes SQL.
  const results: ChatChannelSummary[] = [];
  for (const channel of channels) {
    const membership = memberships.find((m) => m.channelId === channel.id)!;
    const lastMsgRows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.channelId, channel.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);
    const lastMsg = lastMsgRows[0] ?? null;

    let otherMember: ChatChannelSummary["otherMember"] = null;
    if (channel.type === "dm") {
      const otherMembership = allMembers.find((m) => m.channelId === channel.id && m.userId !== user.id);
      if (otherMembership) {
        const other = userById.get(otherMembership.userId);
        if (other) otherMember = { id: other.id, username: other.username, email: other.email };
      }
    }

    const unread = !!lastMsg?.createdAt && lastMsg.userId !== user.id &&
      (!membership.lastReadAt || new Date(lastMsg.createdAt) > new Date(membership.lastReadAt));

    results.push({
      id: channel.id,
      type: channel.type === "dm" ? "dm" : "channel",
      name: channel.name,
      otherMember,
      lastMessage: lastMsg
        ? {
            body: lastMsg.body || (lastMsg.attachmentName ? `📎 ${lastMsg.attachmentName}` : ""),
            createdAt: lastMsg.createdAt,
            authorUsername: userById.get(lastMsg.userId)?.username ?? null,
          }
        : null,
      unread,
    });
  }

  // Neueste Aktivität zuerst.
  results.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bTime - aTime;
  });
  return results;
}

export type ChatMessageDto = {
  id: number;
  channelId: number;
  userId: number;
  username: string | null;
  role: string | null;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  replyToId: number | null;
  // Denormalisierte Vorschau der Nachricht, auf die geantwortet wird -
  // vermeidet einen extra Lookup im Client, falls die Original-Nachricht
  // außerhalb des geladenen Verlaufsfensters liegt.
  replyToBody: string | null;
  replyToUsername: string | null;
  replyToAttachmentName: string | null;
  forwardedFromUsername: string | null;
  createdAt: Date | null;
};

// Für den Chat-Client: Rollenfarben laden, um Usernamen über Nachrichten
// entsprechend einzufärben.
export async function getRoleColorsForChat(): Promise<Record<string, string>> {
  const roles = await getAllRoles();
  return Object.fromEntries(roles.map((r) => [r.name, r.color]));
}

export async function getChannelMessages(channelId: number): Promise<{ error?: string; messages?: ChatMessageDto[] }> {
  const user = await requireChatUser();
  if (!user) return { error: "Keine Berechtigung." };
  if (!(await isMember(channelId, user.id))) return { error: "Kein Zugriff auf diesen Channel." };

  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.channelId, channelId))
    .orderBy(asc(chatMessages.createdAt))
    .limit(200);

  const authorIds = [...new Set(rows.map((r) => r.userId))];
  const authors = authorIds.length
    ? await db.select({ id: users.id, username: users.username, role: users.role, isAdmin: users.isAdmin }).from(users).where(inArray(users.id, authorIds))
    : [];
  const usernameById = new Map(authors.map((a) => [a.id, a.username]));
  const roleById = new Map(authors.map((a) => [a.id, a.isAdmin ? "admin" : a.role]));

  // Reply-Vorschauen auflösen - eigener Lookup statt Join, weil manche
  // Original-Nachrichten außerhalb des 200er-Fensters liegen können.
  const replyToIds = [...new Set(rows.map((r) => r.replyToId).filter((id): id is number => id !== null))];
  const replyToMessages = replyToIds.length
    ? await db.select().from(chatMessages).where(inArray(chatMessages.id, replyToIds))
    : [];
  const replyToAuthorIds = [...new Set(replyToMessages.map((m) => m.userId))];
  const replyToAuthors = replyToAuthorIds.length
    ? await db.select({ id: users.id, username: users.username }).from(users).where(inArray(users.id, replyToAuthorIds))
    : [];
  const replyToUsernameById = new Map(replyToAuthors.map((a) => [a.id, a.username]));
  const replyToById = new Map(replyToMessages.map((m) => [m.id, m]));

  return {
    messages: rows.map((r) => {
      const replyTo = r.replyToId ? replyToById.get(r.replyToId) : null;
      return {
        id: r.id,
        channelId: r.channelId,
        userId: r.userId,
        username: usernameById.get(r.userId) ?? null,
        role: roleById.get(r.userId) ?? null,
        body: r.body,
        attachmentUrl: r.attachmentUrl,
        attachmentName: r.attachmentName,
        attachmentType: r.attachmentType,
        replyToId: r.replyToId,
        replyToBody: replyTo?.body ?? null,
        replyToUsername: replyTo ? (replyToUsernameById.get(replyTo.userId) ?? null) : null,
        replyToAttachmentName: replyTo?.attachmentName ?? null,
        forwardedFromUsername: r.forwardedFromUsername,
        createdAt: r.createdAt,
      };
    }),
  };
}

export async function sendMessage(formData: FormData): Promise<{ error?: string; success?: boolean; message?: ChatMessageDto }> {
  const user = await requireChatUser();
  if (!user) return { error: "Keine Berechtigung." };

  const channelId = Number(formData.get("channelId"));
  const bodyRaw = ((formData.get("body") as string) ?? "").trim();
  const attachmentUrlRaw = ((formData.get("attachmentUrl") as string) ?? "").trim();
  const attachmentNameRaw = ((formData.get("attachmentName") as string) ?? "").trim();
  const attachmentTypeRaw = ((formData.get("attachmentType") as string) ?? "").trim();
  const replyToIdRaw = formData.get("replyToId");
  const replyToId = replyToIdRaw ? Number(replyToIdRaw) : null;

  if (!channelId) return { error: "Ungültig." };
  if (!bodyRaw && !attachmentUrlRaw) return { error: "Nachricht darf nicht leer sein." };
  if (bodyRaw.length > MAX_MESSAGE_LENGTH) return { error: "Nachricht zu lang." };
  if (bodyRaw && isSuspiciousInput(bodyRaw.slice(0, 200))) return { error: "Ungültige Eingabe." };
  if (!(await isMember(channelId, user.id))) return { error: "Kein Zugriff auf diesen Channel." };

  // Nur echte Vercel-Blob-URLs akzeptieren (kommen vom eigenen Upload-Token-
  // Endpoint) - verhindert, dass jemand beliebige externe URLs als
  // "Anhang" einschleust.
  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;
  let attachmentType: string | null = null;
  if (attachmentUrlRaw) {
    if (!attachmentUrlRaw.startsWith("https://") || !attachmentUrlRaw.includes(".public.blob.vercel-storage.com/")) {
      return { error: "Ungültiger Anhang." };
    }
    attachmentUrl = attachmentUrlRaw;
    attachmentName = attachmentNameRaw ? sanitizeText(attachmentNameRaw, 200) : "Anhang";
    attachmentType = attachmentTypeRaw.slice(0, 100);
  }

  // Antwort-Referenz validieren - muss im selben Channel liegen, sonst
  // könnte man theoretisch auf Nachrichten aus fremden Channels verweisen.
  let replyPreview: { id: number; body: string; username: string | null; attachmentName: string | null } | null = null;
  if (replyToId) {
    const replyRows = await db.select().from(chatMessages).where(eq(chatMessages.id, replyToId));
    const replyMsg = replyRows[0];
    if (!replyMsg || replyMsg.channelId !== channelId) {
      return { error: "Ungültige Antwort-Referenz." };
    }
    const replyAuthorRows = await db.select({ username: users.username }).from(users).where(eq(users.id, replyMsg.userId));
    replyPreview = {
      id: replyMsg.id,
      body: replyMsg.body,
      username: replyAuthorRows[0]?.username ?? null,
      attachmentName: replyMsg.attachmentName,
    };
  }

  const body = bodyRaw ? sanitizeText(bodyRaw, MAX_MESSAGE_LENGTH) : "";
  const [message] = await db
    .insert(chatMessages)
    .values({ channelId, userId: user.id, body, attachmentUrl, attachmentName, attachmentType, replyToId: replyPreview?.id ?? null })
    .returning();

  // Eigene Nachricht gilt für einen selbst sofort als gelesen.
  await db
    .update(chatChannelMembers)
    .set({ lastReadAt: new Date() })
    .where(and(eq(chatChannelMembers.channelId, channelId), eq(chatChannelMembers.userId, user.id)));

  try {
    await getPusherServer().trigger(channelEventName(channelId), "new-message", {
      id: message.id,
      channelId,
      userId: user.id,
      username: user.username,
      role: user.isAdmin ? "admin" : user.role,
      body: message.body,
      attachmentUrl: message.attachmentUrl,
      attachmentName: message.attachmentName,
      attachmentType: message.attachmentType,
      replyToId: message.replyToId,
      replyToBody: replyPreview?.body ?? null,
      replyToUsername: replyPreview?.username ?? null,
      replyToAttachmentName: replyPreview?.attachmentName ?? null,
      forwardedFromUsername: message.forwardedFromUsername,
      createdAt: message.createdAt,
    });
  } catch (e) {
    // Nachricht ist in der DB, nur die Live-Zustellung ist fehlgeschlagen
    // (z.B. Pusher nicht konfiguriert) - kein Grund, dem User einen Fehler
    // zu zeigen, beim nächsten Laden der Seite ist die Nachricht trotzdem da.
    console.error("Pusher-Trigger fehlgeschlagen:", e);
  }

  // Push-Benachrichtigung an die übrigen Mitglieder (auch wenn sie /chat
  // gerade nicht offen haben). Vereinfachung: es wird nicht unterschieden,
  // ob jemand den Channel gerade aktiv ansieht - wer pushEnabled hat,
  // bekommt die Benachrichtigung immer. Für ein Team-Tool in dieser Größe
  // unkritisch, ließe sich aber später mit einem Presence-Kanal verfeinern.
  const otherMembers = await db
    .select()
    .from(chatChannelMembers)
    .where(eq(chatChannelMembers.channelId, channelId));
  const channelRows = await db.select().from(chatChannels).where(eq(chatChannels.id, channelId));
  const channel = channelRows[0];
  const senderLabel = user.username ?? "Team-Chat";
  const pushTitlePrefix = /@(everyone|here)\b/i.test(body) ? "🔔 " : "";
  const pushTitle = `${pushTitlePrefix}${channel?.type === "channel" && channel.name ? `#${channel.name} — ${senderLabel}` : senderLabel}`;
  const pushBody = body ? body.slice(0, 140) : attachmentUrl ? `📎 ${attachmentName}` : "";
  const memberUsernames = otherMembers.length
    ? await db.select({ id: users.id, username: users.username }).from(users).where(inArray(users.id, otherMembers.map((m) => m.userId)))
    : [];
  const usernameByMemberId = new Map(memberUsernames.map((u) => [u.id, u.username]));
  await Promise.all(
    otherMembers
      .filter((m) => m.userId !== user.id)
      .map((m) => {
        const mentionedDirectly = usernameByMemberId.get(m.userId)
          ? new RegExp(`@${usernameByMemberId.get(m.userId)}\\b`, "i").test(body)
          : false;
        const title = mentionedDirectly && !pushTitlePrefix ? `🔔 ${pushTitle}` : pushTitle;
        return sendPushToUser(m.userId, { title, body: pushBody, url: "/chat" });
      }),
  );

  return {
    success: true,
    message: {
      id: message.id,
      channelId,
      userId: user.id,
      username: user.username,
      role: user.isAdmin ? "admin" : user.role,
      body: message.body,
      attachmentUrl: message.attachmentUrl,
      attachmentName: message.attachmentName,
      attachmentType: message.attachmentType,
      replyToId: message.replyToId,
      replyToBody: replyPreview?.body ?? null,
      replyToUsername: replyPreview?.username ?? null,
      replyToAttachmentName: replyPreview?.attachmentName ?? null,
      forwardedFromUsername: message.forwardedFromUsername,
      createdAt: message.createdAt,
    },
  };
}

export async function markChannelRead(channelId: number): Promise<{ error?: string; success?: boolean }> {
  const user = await requireChatUser();
  if (!user) return { error: "Keine Berechtigung." };
  if (!(await isMember(channelId, user.id))) return { error: "Kein Zugriff auf diesen Channel." };

  const now = new Date();
  await db
    .update(chatChannelMembers)
    .set({ lastReadAt: now })
    .where(and(eq(chatChannelMembers.channelId, channelId), eq(chatChannelMembers.userId, user.id)));

  try {
    await getPusherServer().trigger(channelEventName(channelId), "read-receipt", {
      channelId,
      userId: user.id,
      lastReadAt: now,
    });
  } catch (e) {
    console.error("Pusher-Trigger fehlgeschlagen:", e);
  }

  return { success: true };
}

export type ChatReadReceipt = { userId: number; lastReadAt: Date | null };

// Lese-Zeitpunkte aller Mitglieder eines Channels - Grundlage für die
// "Gelesen"-Haken bei den eigenen Nachrichten.
export async function getReadReceipts(channelId: number): Promise<{ error?: string; receipts?: ChatReadReceipt[] }> {
  const user = await requireChatUser();
  if (!user) return { error: "Keine Berechtigung." };
  if (!(await isMember(channelId, user.id))) return { error: "Kein Zugriff auf diesen Channel." };

  const rows = await db
    .select({ userId: chatChannelMembers.userId, lastReadAt: chatChannelMembers.lastReadAt })
    .from(chatChannelMembers)
    .where(eq(chatChannelMembers.channelId, channelId));
  return { receipts: rows };
}

export type ChatUserResult = { id: number; username: string | null; email: string };

// Für die "Neuer Channel"/"Neue Direktnachricht"-Suche: nur User anzeigen,
// die selbst Chat-Zugriff haben (sonst könnte man einen Channel mit jemandem
// starten, der die Seite gar nicht sehen kann).
export async function searchChatUsers(query: string): Promise<ChatUserResult[]> {
  const user = await requireChatUser();
  if (!user) return [];
  const q = query.trim();
  if (isSuspiciousInput(q)) return [];

  const roleDefaults = await getSetting(CHAT_ROLE_ACCESS_KEY, CHAT_ROLE_ACCESS_DEFAULT);
  const candidates = q
    ? await db
        .select({ id: users.id, username: users.username, email: users.email, role: users.role, isAdmin: users.isAdmin, chatAccess: users.chatAccess })
        .from(users)
        .where(and(ne(users.id, user.id), ilike(users.username, `%${q}%`)))
        .limit(20)
    : await db
        .select({ id: users.id, username: users.username, email: users.email, role: users.role, isAdmin: users.isAdmin, chatAccess: users.chatAccess })
        .from(users)
        .where(ne(users.id, user.id))
        .limit(50);

  return candidates
    .filter((c) => hasChatAccess(c, roleDefaults))
    .map((c) => ({ id: c.id, username: c.username, email: c.email }));
}

// Findet den bestehenden DM-Channel mit genau diesem einen anderen User,
// oder legt einen neuen an. So gibt es pro Personen-Paar immer nur eine
// einzige Direktnachrichten-Konversation statt versehentlich mehrerer.
export async function getOrCreateDirectMessage(otherUserId: number): Promise<{ error?: string; channelId?: number }> {
  const user = await requireChatUser();
  if (!user) return { error: "Keine Berechtigung." };
  if (!otherUserId || otherUserId === user.id) return { error: "Ungültig." };

  const roleDefaults = await getSetting(CHAT_ROLE_ACCESS_KEY, CHAT_ROLE_ACCESS_DEFAULT);
  const otherRows = await db.select().from(users).where(eq(users.id, otherUserId));
  if (otherRows.length === 0 || !hasChatAccess(otherRows[0], roleDefaults)) {
    return { error: "Dieser User hat keinen Chat-Zugriff." };
  }

  const myMemberships = await db.select().from(chatChannelMembers).where(eq(chatChannelMembers.userId, user.id));
  const myChannelIds = myMemberships.map((m) => m.channelId);
  if (myChannelIds.length > 0) {
    const otherMemberships = await db
      .select()
      .from(chatChannelMembers)
      .where(and(eq(chatChannelMembers.userId, otherUserId), inArray(chatChannelMembers.channelId, myChannelIds)));
    for (const om of otherMemberships) {
      const channelRows = await db.select().from(chatChannels).where(eq(chatChannels.id, om.channelId));
      if (channelRows[0]?.type === "dm") return { channelId: om.channelId };
    }
  }

  const [channel] = await db.insert(chatChannels).values({ type: "dm", name: null, createdBy: user.id }).returning();
  await db.insert(chatChannelMembers).values([
    { channelId: channel.id, userId: user.id },
    { channelId: channel.id, userId: otherUserId },
  ]);

  try {
    await getPusherServer().trigger(userEventName(otherUserId), "new-channel", { channelId: channel.id });
  } catch (e) {
    console.error("Pusher-Trigger fehlgeschlagen:", e);
  }

  return { channelId: channel.id };
}

export async function createChannel(formData: FormData): Promise<{ error?: string; channelId?: number }> {
  const user = await requireChatUser();
  if (!user) return { error: "Keine Berechtigung." };

  if (!user.isAdmin) {
    const roleConfig = await getRoleConfig(user.role);
    // Default true, falls die Rolle (noch) keine Konfiguration für dieses
    // Flag hat - am bisherigen Verhalten (jeder mit Chat-Zugriff durfte
    // Channels anlegen) ändert sich dadurch nichts, bis eine Rolle es
    // explizit einschränkt.
    if (roleConfig && !roleConfig.chatCanCreateChannels) {
      return { error: "Deine Rolle darf keine Channels anlegen." };
    }
  }

  const nameRaw = ((formData.get("name") as string) ?? "").trim();
  if (!nameRaw) return { error: "Bitte einen Namen angeben." };
  if (isSuspiciousInput(nameRaw)) return { error: "Ungültiger Name." };
  const name = sanitizeText(nameRaw, 60);

  const memberIdsRaw = (formData.get("memberIds") as string) ?? "";
  const memberIds = memberIdsRaw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0 && n !== user.id);

  const roleDefaults = await getSetting(CHAT_ROLE_ACCESS_KEY, CHAT_ROLE_ACCESS_DEFAULT);
  const validMembers = memberIds.length
    ? (await db.select().from(users).where(inArray(users.id, [...new Set(memberIds)])))
        .filter((u) => hasChatAccess(u, roleDefaults))
        .map((u) => u.id)
    : [];

  const [channel] = await db.insert(chatChannels).values({ type: "channel", name, createdBy: user.id }).returning();
  const allMemberIds = [...new Set([user.id, ...validMembers])];
  await db.insert(chatChannelMembers).values(allMemberIds.map((id) => ({ channelId: channel.id, userId: id })));

  for (const id of validMembers) {
    try {
      await getPusherServer().trigger(userEventName(id), "new-channel", { channelId: channel.id });
    } catch (e) {
      console.error("Pusher-Trigger fehlgeschlagen:", e);
    }
  }

  return { channelId: channel.id };
}

export async function addChannelMember(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const user = await requireChatUser();
  if (!user) return { error: "Keine Berechtigung." };

  const channelId = Number(formData.get("channelId"));
  const newUserId = Number(formData.get("userId"));
  if (!channelId || !newUserId) return { error: "Ungültig." };

  const channelRows = await db.select().from(chatChannels).where(eq(chatChannels.id, channelId));
  const channel = channelRows[0];
  if (!channel || channel.type !== "channel") return { error: "Ungültiger Channel." };
  if (!(await isMember(channelId, user.id))) return { error: "Kein Zugriff auf diesen Channel." };
  if (await isMember(channelId, newUserId)) return { success: true };

  const roleDefaults = await getSetting(CHAT_ROLE_ACCESS_KEY, CHAT_ROLE_ACCESS_DEFAULT);
  const newUserRows = await db.select().from(users).where(eq(users.id, newUserId));
  if (newUserRows.length === 0 || !hasChatAccess(newUserRows[0], roleDefaults)) {
    return { error: "Dieser User hat keinen Chat-Zugriff." };
  }

  await db.insert(chatChannelMembers).values({ channelId, userId: newUserId });
  try {
    await getPusherServer().trigger(userEventName(newUserId), "new-channel", { channelId });
  } catch (e) {
    console.error("Pusher-Trigger fehlgeschlagen:", e);
  }
  return { success: true };
}

export async function leaveChannel(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const user = await requireChatUser();
  if (!user) return { error: "Keine Berechtigung." };
  const channelId = Number(formData.get("channelId"));
  if (!channelId) return { error: "Ungültig." };

  await db
    .delete(chatChannelMembers)
    .where(and(eq(chatChannelMembers.channelId, channelId), eq(chatChannelMembers.userId, user.id)));
  return { success: true };
}

// ===================================================================
// Nachricht löschen
// ===================================================================
export async function deleteMessage(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const user = await requireChatUser();
  if (!user) return { error: "Keine Berechtigung." };

  const messageId = Number(formData.get("messageId"));
  if (!messageId) return { error: "Ungültig." };

  const rows = await db.select().from(chatMessages).where(eq(chatMessages.id, messageId));
  const message = rows[0];
  if (!message) return { error: "Nachricht nicht gefunden." };
  // Eigene Nachricht immer, sonst ein voller Admin oder eine Rolle mit
  // explizitem Moderationsrecht (chat_can_delete_others_messages).
  if (message.userId !== user.id && !user.isAdmin) {
    const roleConfig = await getRoleConfig(user.role);
    if (!roleConfig?.chatCanDeleteOthersMessages) return { error: "Keine Berechtigung." };
  }

  await db.delete(chatMessages).where(eq(chatMessages.id, messageId));

  try {
    await getPusherServer().trigger(channelEventName(message.channelId), "message-deleted", {
      id: messageId,
      channelId: message.channelId,
    });
  } catch (e) {
    console.error("Pusher-Trigger fehlgeschlagen:", e);
  }

  return { success: true };
}

// ===================================================================
// Mitgliederverwaltung (nur Gruppen-Channels, nicht DMs)
// ===================================================================
export type ChatChannelMemberDto = { id: number; username: string | null; email: string; isCreator: boolean };

export async function listChannelMembers(channelId: number): Promise<{ error?: string; members?: ChatChannelMemberDto[] }> {
  const user = await requireChatUser();
  if (!user) return { error: "Keine Berechtigung." };
  if (!(await isMember(channelId, user.id))) return { error: "Kein Zugriff auf diesen Channel." };

  const channelRows = await db.select().from(chatChannels).where(eq(chatChannels.id, channelId));
  const channel = channelRows[0];
  if (!channel) return { error: "Channel nicht gefunden." };

  const memberships = await db.select().from(chatChannelMembers).where(eq(chatChannelMembers.channelId, channelId));
  const memberIds = memberships.map((m) => m.userId);
  const memberUsers = memberIds.length
    ? await db.select({ id: users.id, username: users.username, email: users.email }).from(users).where(inArray(users.id, memberIds))
    : [];

  return {
    members: memberUsers.map((u) => ({ id: u.id, username: u.username, email: u.email, isCreator: u.id === channel.createdBy })),
  };
}

export async function removeChannelMember(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const user = await requireChatUser();
  if (!user) return { error: "Keine Berechtigung." };

  const channelId = Number(formData.get("channelId"));
  const targetUserId = Number(formData.get("userId"));
  if (!channelId || !targetUserId) return { error: "Ungültig." };

  const channelRows = await db.select().from(chatChannels).where(eq(chatChannels.id, channelId));
  const channel = channelRows[0];
  if (!channel || channel.type !== "channel") return { error: "Ungültiger Channel." };

  // Nur der Ersteller des Channels, ein voller Admin oder eine Rolle mit
  // explizitem Kick-Recht (chat_can_kick_members) darf Mitglieder
  // entfernen - sonst könnte jedes Mitglied jedes andere rauswerfen.
  const isCreator = channel.createdBy === user.id;
  if (!isCreator && !user.isAdmin) {
    const roleConfig = await getRoleConfig(user.role);
    if (!roleConfig?.chatCanKickMembers) return { error: "Nur der Channel-Ersteller kann Mitglieder entfernen." };
  }
  if (targetUserId === channel.createdBy) return { error: "Der Ersteller kann nicht entfernt werden - Channel stattdessen verlassen lassen." };

  await db
    .delete(chatChannelMembers)
    .where(and(eq(chatChannelMembers.channelId, channelId), eq(chatChannelMembers.userId, targetUserId)));

  try {
    await getPusherServer().trigger(userEventName(targetUserId), "removed-from-channel", { channelId });
  } catch (e) {
    console.error("Pusher-Trigger fehlgeschlagen:", e);
  }

  return { success: true };
}

// ===================================================================
// Ungelesen-Indikator fürs Hauptmenü (leichtgewichtig, ohne die
// Nachrichten-/Mitglieder-Details von listMyChannels() zu laden - das hier
// läuft potenziell auf jedem Seitenaufruf über GlobalHeader).
// ===================================================================
export async function hasUnreadChats(): Promise<boolean> {
  const user = await requireChatUser();
  if (!user) return false;

  const memberships = await db.select().from(chatChannelMembers).where(eq(chatChannelMembers.userId, user.id));
  for (const m of memberships) {
    const lastMsgRows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.channelId, m.channelId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);
    const lastMsg = lastMsgRows[0];
    if (!lastMsg || lastMsg.userId === user.id) continue;
    if (!m.lastReadAt || new Date(lastMsg.createdAt ?? 0) > new Date(m.lastReadAt)) return true;
  }
  return false;
}

// ===================================================================
// Nachricht weiterleiten
// ===================================================================
export async function forwardMessage(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const user = await requireChatUser();
  if (!user) return { error: "Keine Berechtigung." };

  const sourceMessageId = Number(formData.get("sourceMessageId"));
  const targetChannelId = Number(formData.get("targetChannelId"));
  if (!sourceMessageId || !targetChannelId) return { error: "Ungültig." };

  const sourceRows = await db.select().from(chatMessages).where(eq(chatMessages.id, sourceMessageId));
  const source = sourceRows[0];
  if (!source) return { error: "Nachricht nicht gefunden." };
  if (!(await isMember(source.channelId, user.id))) return { error: "Kein Zugriff auf die ursprüngliche Nachricht." };
  if (!(await isMember(targetChannelId, user.id))) return { error: "Kein Zugriff auf den Zielchannel." };

  const authorRows = await db.select({ username: users.username }).from(users).where(eq(users.id, source.userId));
  const forwardedFromUsername = authorRows[0]?.username ?? "Unbekannt";

  const [message] = await db
    .insert(chatMessages)
    .values({
      channelId: targetChannelId,
      userId: user.id,
      body: source.body,
      attachmentUrl: source.attachmentUrl,
      attachmentName: source.attachmentName,
      attachmentType: source.attachmentType,
      forwardedFromUsername,
    })
    .returning();

  await db
    .update(chatChannelMembers)
    .set({ lastReadAt: new Date() })
    .where(and(eq(chatChannelMembers.channelId, targetChannelId), eq(chatChannelMembers.userId, user.id)));

  try {
    await getPusherServer().trigger(channelEventName(targetChannelId), "new-message", {
      id: message.id,
      channelId: targetChannelId,
      userId: user.id,
      username: user.username,
      role: user.isAdmin ? "admin" : user.role,
      body: message.body,
      attachmentUrl: message.attachmentUrl,
      attachmentName: message.attachmentName,
      attachmentType: message.attachmentType,
      replyToId: null,
      replyToBody: null,
      replyToUsername: null,
      replyToAttachmentName: null,
      forwardedFromUsername: message.forwardedFromUsername,
      createdAt: message.createdAt,
    });
  } catch (e) {
    console.error("Pusher-Trigger fehlgeschlagen:", e);
  }

  const otherMembers = await db.select().from(chatChannelMembers).where(eq(chatChannelMembers.channelId, targetChannelId));
  const senderLabel = user.username ?? "Team-Chat";
  await Promise.all(
    otherMembers
      .filter((m) => m.userId !== user.id)
      .map((m) => sendPushToUser(m.userId, { title: senderLabel, body: message.body ? message.body.slice(0, 140) : "📎 Weitergeleiteter Anhang", url: "/chat" })),
  );

  return { success: true };
}
