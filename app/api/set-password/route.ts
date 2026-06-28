import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { awardChallengeByType } from "@/app/actions";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { checkLoginRateLimit } from "@/app/utils/ratelimit";

export async function POST(req: NextRequest) {
  // Origin-Check: schützt auch diesen Route Handler vor Anfragen aus
  // nicht vertrauenswürdigen Quellen (gleiche Logik wie bei den Server
  // Actions in actions.ts).
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: "Anfrage abgelehnt." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Anfrage abgelehnt." }, { status: 403 });
    }
  }

  // Vorher wurde hier die Email direkt aus dem Request-Body übernommen und
  // ungeprüft verwendet, um das Passwort zu setzen. Das bedeutete: JEDE
  // Person konnte ohne Login mit {"email": "opfer@example.com", "password":
  // "neu123456"} das Passwort eines beliebigen fremden Accounts überschreiben.
  // Jetzt wird die Identität ausschließlich aus dem signierten,
  // httpOnly-Session-Cookie gelesen.
  const rateLimit = await checkLoginRateLimit();
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte später erneut versuchen." },
      { status: 429 },
    );
  }

  const cookieStore = await cookies();
  const session = verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
  );
  if (!session) {
    return NextResponse.json(
      { error: "Sitzung abgelaufen. Bitte erneut einloggen." },
      { status: 401 },
    );
  }

  const { password } = await req.json();

  // Auch hier: nur fürs allererste Setzen gedacht, kein Überschreiben ohne
  // altes Passwort (gleiche Absicherung wie bei der Server Action).
  const existingResult = await db
    .select({ mustSetPassword: users.mustSetPassword, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.userId));
  const existing = existingResult[0];
  if (existing && existing.passwordHash && existing.mustSetPassword === false) {
    return NextResponse.json(
      { error: "Passwort bereits gesetzt. Bitte über die Profileinstellungen ändern." },
      { status: 400 },
    );
  }

  if (!password || typeof password !== "string")
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json(
      { error: "Mindestens 8 Zeichen." },
      { status: 400 },
    );
  if (password.length > 72)
    return NextResponse.json(
      { error: "Höchstens 72 Zeichen." },
      { status: 400 },
    );

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .update(users)
    .set({ passwordHash, mustSetPassword: false })
    .where(eq(users.id, session.userId));

  if (session.userId <= 100) {
    try {
      await awardChallengeByType(session.userId, "first_100");
    } catch (e) {
      console.error("first_100 challenge award error:", e);
    }
  }
  try {
    await awardChallengeByType(session.userId, "complete_profile");
  } catch (e) {
    console.error("complete_profile challenge award error:", e);
  }

  // Bestätigungs-Email senden
  try {
    const { Resend } = await import("resend");
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Bellator <noreply@mz-dev.de>",
        to: session.email,
        subject: "Bellator Store — Dein Account ist bereit!",
        html: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="UTF-8">
              <style>
                body { font-family: 'Courier New', monospace; background: #000; color: #e0e0e0; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .header { border-bottom: 3px solid white; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { margin: 0; font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: white; }
                .cta { display: inline-block; background: white; color: black !important; padding: 14px 32px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; font-family: 'Courier New', monospace; }
                .footer { margin-top: 40px; padding-top: 20px; font-size: 11px; color: #555; border-top: 1px solid #222; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header"><h1>BELLATOR.</h1></div>
                <p>Dein Account ist jetzt vollständig eingerichtet.</p>
                <p>Du kannst dich ab sofort mit deiner Email und deinem Passwort einloggen.</p>
                <p style="text-align:center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://mz-dev.de"}" class="cta">→ ZUM SHOP</a>
                </p>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Bellator Streetwear.</p>
                  <p>Diese Email wurde an ${session.email} gesendet.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    }
  } catch (e) {
    console.error("Confirmation email error:", e);
    // Kein Fehler zurückgeben — Passwort wurde gesetzt, Email ist optional
  }

  return NextResponse.json({ success: true });
}
