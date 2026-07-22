"use server";

import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getCurrentUser } from "@/app/actions";

/**
 * Schreibt einen Audit-Log-Eintrag für die aktuell eingeloggte Person.
 * Bewusst fehlertolerant (try/catch, nie werfend) - ein Logging-Fehler
 * darf niemals die eigentliche Aktion (z.B. eine Rollenvergabe) blockieren.
 */
export async function logAuditEvent(
  action: string,
  opts?: { targetType?: string; targetId?: string | number; details?: Record<string, unknown> },
): Promise<void> {
  try {
    const user = await getCurrentUser();
    await db.insert(auditLog).values({
      actorUserId: user?.id ?? null,
      actorLabel: user ? (user.username ?? user.email) : "system",
      action,
      targetType: opts?.targetType ?? null,
      targetId: opts?.targetId !== undefined ? String(opts.targetId) : null,
      details: opts?.details ?? null,
    });
  } catch (e) {
    console.error("Audit-Log fehlgeschlagen:", e);
  }
}

export async function getAuditLog(limit = 300) {
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
}
