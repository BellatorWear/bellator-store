export const metadata = { title: "Impressum — Bellator Streetwear" };

export default function ImpressumPage() {
  return (
    <main className="min-h-screen text-[#e0e0e0] font-mono" style={{ backgroundImage: 'url("/background.png")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <header className="bg-black border-b border-[#333] px-6 py-4 flex justify-between items-center">
        <a href="/shop" className="text-2xl font-bold tracking-tighter italic hover:opacity-80 transition">BELLATOR.</a>
        <a href="/shop" className="text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition">← Zurück</a>
      </header>
      <div className="flex justify-center p-4 sm:p-6 md:p-16">
        <div className="w-full max-w-2xl space-y-6">
          <div className="bg-black/90 p-4">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-1">Impressum</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Angaben gemäß § 5 TMG</p>
          </div>
          <div className="border border-zinc-700 bg-black/90 p-6 space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">Anbieter</h2>
              <p>[Vor- und Nachname / Firmenname]<br />[Straße und Hausnummer]<br />[PLZ und Ort]<br />[Land]</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">Kontakt</h2>
              <p>Telefon: [Telefonnummer]<br />E-Mail: [kontakt@deine-domain.de]</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">Umsatzsteuer-ID</h2>
              <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: [USt-IdNr. falls vorhanden]</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">Verantwortlich für den Inhalt</h2>
              <p>nach § 18 Abs. 2 MStV:<br />[Vor- und Nachname]<br />[Anschrift wie oben]</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">EU-Streitschlichtung</h2>
              <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                  https://ec.europa.eu/consumers/odr/
                </a>.</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">Verbraucherstreitbeilegung</h2>
              <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
            </section>
          </div>
          <div className="bg-black/90 p-4 text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed">
            Hinweis: Dies ist eine Vorlage. Bitte alle Platzhalter in eckigen Klammern durch deine echten, rechtsgültigen Angaben ersetzen, bevor die Seite live geht. Für ein vollständiges Impressum sowie eine Datenschutzerklärung empfehlen wir, eine:n Rechtsanwält:in oder einen Impressum-Generator zu konsultieren.
          </div>
        </div>
      </div>
    </main>
  );
}
