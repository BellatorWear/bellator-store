import { db } from "@/db";
import { emailLog } from "@/db/schema";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

type SendEmailOpts = {
  to: string | string[];
  subject: string;
  html: string;
  source: string;
};

export async function sendEmail({ to, subject, html, source }: SendEmailOpts) {
  if (!resend) return { error: "E-Mail Dienst nicht konfiguriert (RESEND_API_KEY fehlt)." };

  const toList = Array.isArray(to) ? to : [to];
  let sent = 0;

  for (const recipient of toList) {
    try {
      await resend.emails.send({
        from: "Bellator <noreply@mz-dev.de>",
        to: recipient,
        subject,
        html,
      });
      // Jede versendete Mail protokollieren
      await db.insert(emailLog).values({
        to: recipient,
        subject,
        bodyHtml: html,
        source,
      });
      sent++;
    } catch (e) {
      console.error("Email-Fehler an", recipient, ":", e);
    }
  }

  return { sent };
}
