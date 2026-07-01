export const metadata = { title: "AGB — Bellator Streetwear" };

export default function AGBPage() {
  return (
    <main className="min-h-screen text-[#e0e0e0] font-mono" style={{ backgroundImage: 'url("/background.webp")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <header className="bg-black border-b border-[#333] px-6 py-4 flex justify-between items-center">
        <a href="/shop" className="text-2xl font-bold tracking-tighter italic hover:opacity-80 transition">BELLATOR.</a>
        <a href="/shop" className="text-xs font-bold uppercase tracking-widest text-white bg-black/70 border border-zinc-500 px-3 py-1.5 hover:bg-white hover:text-black transition-all inline-block">← Zurück zum Shop</a>
      </header>
      <div className="flex justify-center p-4 sm:p-6 md:p-16">
        <div className="w-full max-w-2xl space-y-6">
          <div className="bg-black/90 p-4">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-1">Allgemeine Geschäftsbedingungen</h1>
          </div>
          <div className="border border-zinc-700 bg-black/90 p-6 space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">1. Geltungsbereich</h2>
              <p>Diese AGB gelten für alle Bestellungen über den Bellator-Onlineshop, betrieben von [Vor- und Nachname / Firmenname], [Anschrift].</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">2. Vertragsschluss</h2>
              <p>Die Darstellung der Produkte stellt kein verbindliches Angebot dar. Mit Abschluss der Zahlung über Stripe geben Sie eine verbindliche Bestellung auf. Der Vertrag kommt mit unserer Bestätigung (z.B. per Email) zustande.</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">3. Preise und Zahlung</h2>
              <p>Alle Preise verstehen sich in Euro inkl. der gesetzlichen Mehrwertsteuer, zzgl. Versandkosten. Die Zahlung erfolgt über Stripe (Kreditkarte, ggf. weitere von Stripe angebotene Methoden).</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">4. Lieferung</h2>
              <p>Die Lieferzeit beträgt in der Regel [X] Werktage innerhalb Deutschlands, sofern nichts anderes angegeben ist. Bei limitierten Drops kann es je nach Nachfrage zu Verzögerungen kommen.</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">5. Widerrufsrecht</h2>
              <p>Verbraucher:innen steht ein gesetzliches Widerrufsrecht von 14 Tagen zu. Genaue Bedingungen und das Muster-Widerrufsformular sind separat bereitzustellen – bitte vor Live-Gang ergänzen (gesetzlich vorgeschrieben).</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">6. Punkte, Challenges und Prämien</h2>
              <p>Im Rahmen unseres Treueprogramms können Punkte durch bestimmte Aktionen ("Challenges") gesammelt und gegen Prämien eingetauscht werden. Punkte und Prämien haben keinen Bargeld- oder Auszahlungswert, sind nicht übertragbar und können bei Verstoß gegen diese AGB oder Missbrauch verfallen. Wir behalten uns vor, das Programm jederzeit anzupassen oder einzustellen.</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">7. Gewährleistung</h2>
              <p>Es gelten die gesetzlichen Gewährleistungsrechte.</p>
            </section>
            <section>
              <h2 className="text-zinc-400 uppercase text-xs tracking-widest mb-2">8. Schlussbestimmungen</h2>
              <p>Es gilt deutsches Recht. Sollte eine Bestimmung dieser AGB unwirksam sein, bleiben die übrigen Bestimmungen davon unberührt.</p>
            </section>
          </div>
          <div className="bg-black/90 p-4 text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed">
            Hinweis: Dies ist eine Vorlage und ersetzt keine Rechtsberatung, insbesondere zum Widerrufsrecht (gesetzliche Pflichtangaben fehlen noch). Bitte vor Live-Gang von einer:m Anwält:in prüfen lassen.
          </div>
        </div>
      </div>
    </main>
  );
}
