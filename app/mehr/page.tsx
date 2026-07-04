import InfoPageLayout from "@/app/components/InfoPageLayout";
import Link from "next/link";

export default function MehrPage() {
  return (
    <InfoPageLayout title="Mehr" subtitle="Über Bellator Streetwear">
      <div className="space-y-6">
        <section className="border border-zinc-700 bg-black/80 p-5 sm:p-6 space-y-4 text-sm leading-relaxed text-zinc-300">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Über uns</h2>
          <p>Bellator Streetwear steht für kompromissloses Design, hochwertige Materialien und eine Ästhetik, die keine Erklärungen braucht.</p>
          <p>240g Heavy Cotton. Oversized Fit. Made for the streets.</p>
        </section>
        <section className="border border-zinc-700 bg-black/80 p-5 sm:p-6 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Links</h2>
          {[
            ["/impressum", "Impressum"],
            ["/datenschutz", "Datenschutzerklärung"],
            ["/agb", "AGB"],
            ["/hilfe", "Hilfe & FAQ"],
            ["/news", "News"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="block text-zinc-400 hover:text-white transition uppercase text-xs tracking-widest">
              → {label}
            </Link>
          ))}
          <a href="https://discord.gg/T4RwVJRyRp" target="_blank" rel="noopener noreferrer"
            className="block text-zinc-400 hover:text-[#5865F2] transition uppercase text-xs tracking-widest">
            → Discord
          </a>
        </section>
      </div>
    </InfoPageLayout>
  );
}
