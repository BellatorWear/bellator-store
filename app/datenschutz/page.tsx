import InfoPageLayout from "@/app/components/InfoPageLayout";

export const metadata = { title: "Datenschutzerklärung — Bellator Streetwear" };

export default function Page() {
  return (
    <InfoPageLayout title="Datenschutzerklärung">
      <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
        <div className="bg-black/90 p-4">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-1">Datenschutzerklärung</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Gemäß Art. 13, 14 DSGVO</p>
          </div>
          <div className="border border-zinc-700 bg-black/90 p-6 space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">1. Verantwortlicher</h2>
              <p>[Vor- und Nachname / Firmenname]<br />[Straße und Hausnummer]<br />[PLZ und Ort]<br />E-Mail: [kontakt@deine-domain.de]</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">2. Welche Daten wir verarbeiten</h2>
              <p>Bei der Nutzung von Bellator verarbeiten wir je nach genutzter Funktion:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Account: Email-Adresse, Passwort (verschlüsselt gespeichert, niemals im Klartext), Benutzername</li>
                <li>Bestellungen: Bestelldaten, Zahlungsabwicklung über Stripe (siehe Punkt 5)</li>
                <li>Cookies: Session-Cookie (technisch notwendig, damit du eingeloggt bleibst), Warenkorb-Cookie, Theme-Einstellung</li>
                <li>Optional, mit deiner Einwilligung: Push-Benachrichtigungen, Newsletter-Email</li>
                <li>Technisch: IP-Adresse, Zeitstempel (z.B. für Sicherheits-/Rate-Limiting-Zwecke)</li>
              </ul>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">3. Zweck und Rechtsgrundlage</h2>
              <p>Die Verarbeitung erfolgt zur Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO, z.B. Bestellabwicklung), zur Wahrung berechtigter Interessen (Art. 6 Abs. 1 lit. f DSGVO, z.B. Betrugs-/Missbrauchsprävention) oder auf Basis deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, z.B. Newsletter, Push-Benachrichtigungen). Einwilligungen kannst du jederzeit in den Einstellungen widerrufen.</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">4. Speicherdauer</h2>
              <p>Wir speichern Daten nur so lange, wie es für den jeweiligen Zweck nötig ist oder gesetzliche Aufbewahrungsfristen (z.B. handels-/steuerrechtlich) es vorschreiben. Warenkorb-Daten werden nach 24 Stunden Inaktivität automatisch gelöscht.</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">5. Eingesetzte Dienstleister (Auftragsverarbeiter)</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Neon (Datenbank-Hosting)</strong> – Speicherung der Account-/Bestelldaten</li>
                <li><strong>Stripe</strong> – Zahlungsabwicklung. Zahlungsdaten (Kartendaten etc.) laufen direkt über Stripe, nicht über unsere Server. Siehe <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Stripe-Datenschutzerklärung</a></li>
                <li><strong>Resend</strong> – Versand von Transaktions-Emails (Verifizierung, Zugangsschlüssel)</li>
                <li>[Falls genutzt: Google Analytics, Google Tag Manager, Cloudflare – bitte ergänzen, sobald aktiv]</li>
              </ul>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">6. Deine Rechte</h2>
              <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO). Du kannst dein Konto und alle zugehörigen Daten jederzeit über die Profilseite selbst löschen, oder uns unter [kontakt@deine-domain.de] kontaktieren.</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">7. Beschwerderecht</h2>
              <p>Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, wenn du der Ansicht bist, dass die Verarbeitung deiner Daten gegen die DSGVO verstößt.</p>
            </section>
          </div>
          <div className="bg-black/90 p-4 text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed">
            Hinweis: Dies ist eine Vorlage und ersetzt keine Rechtsberatung. Bitte alle Platzhalter ausfüllen, die Liste der Dienstleister an euren tatsächlichen Stand anpassen (z.B. sobald Google Analytics/Cloudflare aktiv ist) und vor Live-Gang von einer:m Anwält:in prüfen lassen.
          </div>
      </div>
    </InfoPageLayout>
  );
}
