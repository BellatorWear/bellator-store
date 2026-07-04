import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cartItems, users, products } from "@/db/schema";
import { lt, eq, and, isNotNull } from "drizzle-orm";
import { sendEmail } from "@/app/utils/email";
import { sendPushToUser } from "@/app/utils/push";

// Wird täglich ausgeführt (z.B. als Vercel Cron Job in vercel.json).
// - Nach 1 Tag: Push + Email-Erinnerung an User mit aktiven Warenkörben
// - Nach 3 Tagen: Warenkorb automatisch leeren
//
// Setup in vercel.json:
// { "crons": [{ "path": "/api/cart-cleanup", "schedule": "0 9 * * *" }] }
//
// Der Header CRON_SECRET (Vercel setzt das automatisch) schützt die Route.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // === 1. Warenkörbe nach 3 Tagen löschen ===
  const expiredCarts = await db
    .select()
    .from(cartItems)
    .where(lt(cartItems.addedAt, threeDaysAgo));

  if (expiredCarts.length > 0) {
    await db.delete(cartItems).where(lt(cartItems.addedAt, threeDaysAgo));
    console.log(`Cart cleanup: ${expiredCarts.length} Items gelöscht (>3 Tage).`);
  }

  // === 2. Erinnerung nach 1 Tag ===
  // Finde Warenkörbe die zwischen 1 und 3 Tagen alt sind (noch nicht gelöscht)
  // und zähle nur UNIQUE owner_keys mit zugehörigem User.
  const reminderCarts = await db
    .select({ ownerKey: cartItems.ownerKey, addedAt: cartItems.addedAt })
    .from(cartItems)
    .where(and(lt(cartItems.addedAt, oneDayAgo)));

  // Deduplizieren nach ownerKey
  const uniqueOwnerKeys = Array.from(new Set(reminderCarts.map(c => c.ownerKey)));

  let remindersSet = 0;
  for (const ownerKey of uniqueOwnerKeys) {
    // ownerKey enthält die userId wenn eingeloggt (Format: user-{id}-{suffix})
    const userIdMatch = ownerKey.match(/^user-(\d+)-/);
    if (!userIdMatch) continue;
    const userId = parseInt(userIdMatch[1], 10);
    if (!userId) continue;

    const userRows = await db.select().from(users).where(eq(users.id, userId));
    const user = userRows[0];
    if (!user) continue;

    // Erinnerungs-Push schicken
    if (user.pushEnabled && user.pushSubscription) {
      await sendPushToUser(userId, {
        title: "Dein Warenkorb wartet!",
        body: "Du hast noch Artikel im Warenkorb. Schau mal vorbei — limitierte Stückzahl!",
        url: "/shop/warenkorb",
      });
    }

    // Erinnerungs-Email schicken
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Dein Warenkorb bei Bellator wartet noch auf dich",
        source: "reminder",
        html: `
          <!DOCTYPE html><html><body style="font-family:'Courier New',monospace;background:#000;color:#e0e0e0;margin:0;padding:40px 20px;">
          <div style="max-width:600px;margin:0 auto;">
            <h1 style="color:white;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;border-bottom:2px solid white;padding-bottom:16px;">BELLATOR.</h1>
            <p style="margin-top:24px;font-size:14px;">Hey ${user.username ?? ""},</p>
            <p style="font-size:14px;">du hast noch Artikel in deinem Warenkorb — aber Vorsicht: <strong>streng limitiert!</strong></p>
            <p style="text-align:center;margin:30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://mz-dev.de"}/shop/warenkorb"
                style="display:inline-block;background:white;color:black;padding:14px 32px;text-decoration:none;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;">
                Zum Warenkorb →
              </a>
            </p>
            <p style="font-size:11px;color:#555;border-top:1px solid #222;padding-top:16px;margin-top:32px;">
              © ${new Date().getFullYear()} Bellator Streetwear
            </p>
          </div></body></html>
        `,
      });
    }
    remindersSet++;
  }

  return NextResponse.json({ deleted: expiredCarts.length, reminded: remindersSet });
}
