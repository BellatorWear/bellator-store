import InfoPageLayout from "@/app/components/InfoPageLayout";

export default function HilfePage() {
  const faqs = [
    { q: "Wie bekomme ich Zugang zum Shop?", a: "Klicke auf 'Registrieren', gib deine Email ein und bestätige den Link in der Email." },
    { q: "Was ist ein Access Key?", a: "Der Access Key ist eine alternative Einlogmethode. Er ist 7 Tage gültig und kann nur einmal verwendet werden." },
    { q: "Wie kann ich bezahlen?", a: "Wir akzeptieren alle gängigen Kreditkarten, PayPal und weitere Methoden über Stripe." },
    { q: "Wie lange dauert die Lieferung?", a: "Die Lieferzeit beträgt in der Regel 3–7 Werktage innerhalb Deutschlands." },
    { q: "Kann ich meine Bestellung zurückgeben?", a: "Ja, du hast 14 Tage Widerrufsrecht ab Erhalt der Ware." },
    { q: "Was sind Bellator-Punkte?", a: "Für jede Bestellung sammelst du Punkte (10 Punkte pro Euro), die du gegen Rabatte und exklusive Vorteile einlösen kannst." },
    { q: "Was ist ein Pre-Release-Code?", a: "Mit einem Pre-Release-Code bekommst du frühzeitig Zugriff auf neue Drops, bevor sie offiziell verfügbar sind." },
    { q: "Wie löse ich einen Code ein?", a: "Klicke auf 'Code eingeben' im Menü (oben rechts, drei Striche) und gib deinen Code ein. Er gilt entweder als Rabatt beim Checkout oder als Pre-Release-Zugang." },
  ];

  return (
    <InfoPageLayout title="Hilfe & FAQ" subtitle="Häufig gestellte Fragen">
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <section key={i} className="border border-zinc-700 bg-black/80 p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-2">{faq.q}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
          </section>
        ))}
        <div className="border border-zinc-700 bg-black/80 p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">Noch Fragen?</h2>
          <p className="text-sm text-zinc-500">Schreib uns auf <a href="https://discord.gg/T4RwVJRyRp" className="text-white hover:text-[#5865F2] transition">Discord</a> oder per Mail an <span className="text-white">kontakt@mz-dev.de</span></p>
        </div>
      </div>
    </InfoPageLayout>
  );
}
