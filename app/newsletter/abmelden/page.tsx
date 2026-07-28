import { db } from "@/db";
import { users, newsletter } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyUnsubscribeToken } from "@/app/utils/unsubscribeToken";

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email: emailRaw, token } = await searchParams;
  const email = (emailRaw ?? "").trim().toLowerCase();

  const valid = email && token && verifyUnsubscribeToken(email, token);

  if (valid) {
    // Deckt beide Quellen ab, die newsletterMail.ts anschreibt: Gast-
    // Eintrag in der newsletter-Tabelle UND/ODER eingeloggte User mit
    // newsletterOptIn - je nachdem, was für diese Email existiert.
    await Promise.all([
      db.update(newsletter).set({ active: false }).where(eq(newsletter.email, email)),
      db.update(users).set({ newsletterOptIn: false }).where(eq(users.email, email)),
    ]);
  }

  return (
    <div className="min-h-screen flex flex-col font-mono t-text site-bg">
      <div className="relative z-10 flex flex-col min-h-screen t-invert items-center justify-center p-4">
        <div className="t-card border p-8 max-w-sm w-full text-center space-y-4">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Bellator</h1>
          {valid ? (
            <p className="text-sm t-muted">
              ✓ <strong className="t-text">{email}</strong> wurde vom Newsletter abgemeldet.
            </p>
          ) : (
            <p className="text-sm t-muted">
              Dieser Abmelde-Link ist ungültig oder abgelaufen. Du kannst dich auch jederzeit über deine
              Kontoeinstellungen abmelden.
            </p>
          )}
          <a
            href="/"
            className="inline-block border t-border px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-200 active:scale-[0.97]"
          >
            Zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}
