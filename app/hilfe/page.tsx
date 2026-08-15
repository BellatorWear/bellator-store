import type { Metadata } from "next";
import InfoPageLayout from "@/app/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "Hilfe & FAQ",
  description: "Antworten auf die häufigsten Fragen zu Bestellung, Versand, Rückgabe, Bellator-Punkten und Zugang zum Shop.",
};

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

  // FAQPage-JSON-LD: macht die Fragen als aufklappbare Rich-Snippets direkt
  // in der Google-Suche sichtbar, nicht erst nach einem Klick auf die Seite.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <InfoPageLayout title="Hilfe & FAQ" subtitle="Häufig gestellte Fragen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <section key={i} className="border border-zinc-700 bg-black/80 p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-2">{faq.q}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
          </section>
        ))}
        <div className="border border-zinc-700 bg-black/80 p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">Noch Fragen?</h2>
          <p className="text-sm text-zinc-500 mb-2">Schreib uns auf <a href="https://discord.gg/T4RwVJRyRp" className="text-white hover:text-[#5865F2] transition">Discord</a> oder per Mail an <span className="text-white">kontakt@mz-dev.de</span></p>
          {/*
            TODO (Michael): Zahl unten ist ein Platzhalter - bitte auf die
            tatsächlich realistische Reaktionszeit deines Teams anpassen,
            bevor das live geht. Ein Versprechen, das nicht eingehalten
            wird, schadet mehr als gar keine Angabe.
          */}
          <p className="text-[11px] text-zinc-600 uppercase tracking-widest">Antwort in der Regel innerhalb von 24 Stunden</p>
        </div>
      </div>
    </InfoPageLayout>
  );
}
