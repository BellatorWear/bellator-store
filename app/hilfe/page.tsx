export default function HilfePage() {
  const faqs = [
    {
      q: "Wie bekomme ich Zugang zum Shop?",
      a: "Klicke auf 'Registrieren', gib deine Email ein und bestätige den Link in der Email.",
    },
    {
      q: "Was ist ein Access Key?",
      a: "Der Access Key ist eine alternative Einlogmethode, die wir dir per Email schicken. Er ist 7 Tage gültig und kann nur einmal verwendet werden.",
    },
    {
      q: "Wie kann ich bezahlen?",
      a: "Wir akzeptieren PayPal, Klarna und Visa.",
    },
    {
      q: "Wie lange dauert die Lieferung?",
      a: "Die Lieferzeit beträgt in der Regel 3–7 Werktage innerhalb Deutschlands.",
    },
    {
      q: "Kann ich meine Bestellung zurückgeben?",
      a: "Ja, du hast 14 Tage Widerrufsrecht ab Erhalt der Ware.",
    },
    {
      q: "Was sind Bellator-Punkte?",
      a: "Für jede Bestellung und bestimmte Aktionen sammelst du Punkte, die du für zukünftige Bestellungen einlösen kannst.",
    },
  ];

  return (
    <main
      className="min-h-screen text-[#e0e0e0] font-mono"
      style={{
        backgroundImage: 'url("/background.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <header className="bg-black border-b border-[#333] px-6 py-4 flex justify-between items-center">
        <a
          href="/shop"
          className="text-2xl font-bold tracking-tighter italic hover:opacity-80 transition"
        >
          BELLATOR.
        </a>
        <a
          href="/shop"
          className="text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition"
        >
          ← Zurück zum Shop
        </a>
      </header>
      <div className="flex justify-center p-6 md:p-16">
        <div className="w-full max-w-xl space-y-8">
          <div className="bg-black/80 p-4">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">
              Hilfe & FAQ
            </h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">
              Häufig gestellte Fragen
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <section
                key={i}
                className="border border-zinc-700 bg-black/80 p-6"
              >
                <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-2">
                  {faq.q}
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">{faq.a}</p>
              </section>
            ))}
          </div>
          <div className="border border-zinc-700 bg-black/80 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Noch Fragen?
            </h2>
            <p className="text-xs text-zinc-500">
              Schreib uns an:{" "}
              <span className="text-white">E-MAIL EINFÜGEN</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
