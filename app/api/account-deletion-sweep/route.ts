import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, lte, isNull, isNotNull, eq } from "drizzle-orm";

// Läuft täglich (siehe vercel.json crons). Findet alle Accounts, deren
// 7-Tage-Einwandsfrist (siehe requestUserDeletion in app/admin/actions.ts)
// abgelaufen ist, und anonymisiert sie.
//
// Bewusst ANONYMISIEREN statt die Zeile hart zu löschen: users.id wird an
// vielen Stellen referenziert (Bestellungen, Support-Tickets, Chat-
// Nachrichten). Ein DELETE würde entweder an Fremdschlüssel-Constraints
// scheitern oder - falls diese ON DELETE CASCADE gesetzt sind - Rechnungs-
// /Bestelldaten mitreißen, die wir aus steuerrechtlichen Gründen (§147 AO,
// 10 Jahre Aufbewahrungspflicht) noch gar nicht löschen dürfen. GDPR Art.
// 17(3)(b) erlaubt genau das: Löschung der personenbezogenen Daten
// (Email, Username, Passwort) bei gleichzeitigem Erhalt der Bestellhistorie
// unter einer anonymisierten Kennung.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await db
    .select()
    .from(users)
    .where(and(isNotNull(users.pendingDeletionAt), lte(users.pendingDeletionAt, new Date()), isNull(users.anonymizedAt)));

  let count = 0;
  for (const user of due) {
    await db
      .update(users)
      .set({
        email: `deleted-${user.id}@deleted.invalid`,
        username: null,
        passwordHash: null,
        pushSubscription: null,
        pushEnabled: false,
        newsletterOptIn: false,
        theme: "dark",
        // sessionVersion nochmal hochzählen - schadet nicht, auch wenn
        // der Account durch pending_deletion_at ohnehin schon gesperrt war.
        sessionVersion: (user.sessionVersion ?? 0) + 1,
        anonymizedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    count++;
  }

  console.log(`Account-Löschungs-Sweep: ${count} Account(s) anonymisiert.`);
  return NextResponse.json({ success: true, anonymized: count });
}
