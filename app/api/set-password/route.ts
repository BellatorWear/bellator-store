import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password)
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json(
      { error: "Mindestens 8 Zeichen." },
      { status: 400 },
    );

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .update(users)
    .set({ passwordHash, mustSetPassword: false })
    .where(eq(users.email, email));

  // Bestätigungs-Email senden
  try {
    const { Resend } = await import("resend");
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Bellator <noreply@mz-dev.de>",
        to: email,
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
                  <p>Diese Email wurde an ${email} gesendet.</p>
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
