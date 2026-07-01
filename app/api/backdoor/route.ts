import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// ===================================================================
// ADMIN-BACKDOOR — nur du weißt von dieser URL
// ===================================================================
// Aufruf: POST /api/backdoor?token=DEIN_TOKEN&email=deine@email.de
// Setzt is_admin = true für die angegebene Email, egal was sonst
// passiert ist. Braucht BACKDOOR_TOKEN als Umgebungsvariable.
//
// Das Token kommt NICHT aus dem Code (wäre im Git zu sehen), sondern
// NUR aus der Vercel-Umgebungsvariable BACKDOOR_TOKEN.
// Trage also folgende Variable bei Vercel ein:
//   BACKDOOR_TOKEN = [ein langes zufälliges Geheimnis, nur du kennst es]
//
// Danach z.B. mit curl:
//   curl -X POST 'https://deine-domain.de/api/backdoor?token=...&email=...'
// ===================================================================
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email");

  const expectedToken = process.env.BACKDOOR_TOKEN;
  if (!expectedToken) {
    // Wenn kein Token konfiguriert ist, komplett verweigern.
    return NextResponse.json({ error: "Not configured." }, { status: 404 });
  }
  if (!token || token !== expectedToken) {
    // Falschem Token sieht es aus wie eine 404 - kein Hinweis darauf,
    // dass es diese Route überhaupt gibt.
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!email) {
    return NextResponse.json({ error: "email parameter required." }, { status: 400 });
  }

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length === 0) {
    // Wenn der Account noch nicht existiert: klarer Hinweis.
    return NextResponse.json({ error: "User not found. Create an account first." }, { status: 404 });
  }

  await db.update(users).set({ isAdmin: true, mustSetPassword: false }).where(eq(users.email, email));

  return NextResponse.json({ ok: true, message: `Admin granted for ${email}.` });
}
