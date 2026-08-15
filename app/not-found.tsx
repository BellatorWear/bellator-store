import type { Metadata } from "next";
import Link from "next/link";
import InfoPageLayout from "@/app/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "Seite nicht gefunden — Bellator Streetwear",
  description: "Diese Seite existiert nicht (mehr). Geh zurück zum Shop, zur Startseite oder zu den News.",
  robots: { index: false, follow: true },
};

// Next.js ruft diese Komponente automatisch für jede nicht existierende
// Route auf (App Router Convention). Wichtig für SEO/UX: statt der
// generischen Next.js-Fehlerseite bekommt der Nutzer sofort weiterführende,
// interne Links statt einer Sackgasse.
export default function NotFound() {
  return (
    <InfoPageLayout title="404" subtitle="Diese Seite gibt es nicht (mehr)">
      <div className="border border-zinc-700 bg-black/80 p-6 sm:p-10 text-center">
        <p className="text-sm text-zinc-400 leading-relaxed mb-8 max-w-md mx-auto">
          Der Link ist vermutlich veraltet, oder das Piece, das du gesucht hast,
          ist bereits ausverkauft und wurde aus dem Shop entfernt.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <Link href="/"
            className="inline-block bg-white border-[3px] border-white px-6 py-3 text-xs font-black uppercase tracking-widest text-black hover:bg-transparent hover:text-white transition-all duration-200">
            Zur Startseite
          </Link>
          <Link href="/shop"
            className="inline-block border-[3px] border-white px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all duration-200">
            Zum Shop
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] uppercase tracking-widest">
          <Link href="/news" className="text-zinc-400 hover:text-white transition">News</Link>
          <Link href="/shop/challenges" className="text-zinc-400 hover:text-white transition">Challenges</Link>
          <Link href="/hilfe" className="text-zinc-400 hover:text-white transition">Hilfe & FAQ</Link>
          <Link href="/shop/warenkorb" className="text-zinc-400 hover:text-white transition">Warenkorb</Link>
        </div>
      </div>
    </InfoPageLayout>
  );
}
