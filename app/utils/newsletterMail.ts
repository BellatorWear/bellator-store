import { db } from "@/db";
import { users, newsletter } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Schickt eine Newsletter-Mail an ALLE Abonnenten - sowohl eingeloggte
 * User mit aktiviertem newsletterOptIn als auch Gäste, die sich nur über
 * die "Next Drop"-Box (newsletter Tabelle) eingetragen haben, ohne Account.
 *
 * WICHTIG: Vorher gab es dafür gar keinen automatischen Versand - die
 * "Newsletter abonnieren"-Funktion hat nur die Anmeldung bestätigt, aber
 * nie tatsächlich Drop-/Aktions-Mails verschickt. Das passiert jetzt über
 * den News-Channel im Admin-Panel (jeder Post geht automatisch raus).
 */
export async function sendNewsletterEmailToAll(
  subject: string,
  bodyText: string,
  bodyHtml?: string | null,
  attachments?: { url: string; name: string }[],
) {
  if (!resend) return { sent: 0, error: "E-Mail Dienst nicht konfiguriert (RESEND_API_KEY fehlt)." };

  const optedInUsers = await db.select({ email: users.email }).from(users).where(eq(users.newsletterOptIn, true));
  const guestSubs = await db.select({ email: newsletter.email }).from(newsletter).where(eq(newsletter.active, true));

  const emails = Array.from(new Set([...optedInUsers, ...guestSubs].map((r) => r.email).filter(Boolean)));
  if (emails.length === 0) return { sent: 0, error: null };

  // Freier HTML-Inhalt (Bilder, eigenes Layout) hat Vorrang vor dem
  // Klartext, falls der Admin welchen geschrieben hat.
  const contentHtml = bodyHtml && bodyHtml.trim()
    ? bodyHtml
    : `<p style="line-height:1.6; white-space:pre-wrap;">${bodyText}</p>`;

  const resendAttachments = (attachments ?? [])
    .filter((a) => a.url)
    .map((a) => ({ filename: a.name || "anhang", path: a.url }));

  let sent = 0;
  // Resend erlaubt mehrere "to"-Adressen nicht beliebig groß auf einmal -
  // einzeln verschicken ist hier bei einer kleinen Shop-Liste unkritisch.
  for (const email of emails) {
    try {
      await resend.emails.send({
        from: "Bellator <noreply@mz-dev.de>",
        to: email,
        subject: `Bellator Store — ${subject}`,
        attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
        html: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="UTF-8" /></head>
            <body style="font-family: 'Courier New', monospace; background: #000; color: #e0e0e0; margin:0; padding:0;">
              <div style="max-width:600px; margin:0 auto; padding:40px 20px;">
                <div style="border-bottom:3px solid white; padding-bottom:20px; margin-bottom:30px;">
                  <h1 style="margin:0; font-size:28px; font-weight:900; text-transform:uppercase; letter-spacing:0.15em; color:white;">BELLATOR.</h1>
                </div>
                <h2 style="color:white; text-transform:uppercase;">${subject}</h2>
                ${contentHtml}
                <p style="text-align:center; margin:30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://mz-dev.de"}/shop" style="display:inline-block; background:white; color:black; padding:14px 32px; text-decoration:none; font-weight:bold; text-transform:uppercase; letter-spacing:0.1em;">Zum Shop</a>
                </p>
                <div style="margin-top:40px; padding-top:20px; font-size:11px; color:#555; border-top:1px solid #222;">
                  <p>© ${new Date().getFullYear()} Bellator Streetwear. Diese Mail wurde an ${email} gesendet, weil du den Bellator Newsletter abonniert hast.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
      sent++;
    } catch (e) {
      console.error("Newsletter-Mail an", email, "fehlgeschlagen:", e);
    }
  }

  return { sent, error: null };
}
