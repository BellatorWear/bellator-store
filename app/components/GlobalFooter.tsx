import Link from "next/link";

export default function GlobalFooter() {
  return (
    <footer className="bg-black border-t border-zinc-800 font-mono mt-auto t-no-invert">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-[11px] uppercase tracking-widest">
        <div>
          <p className="font-black text-white mb-4 text-base italic">BELLATOR.</p>
          <p className="text-zinc-500 leading-relaxed normal-case text-[10px]">
            240g Heavy Cotton.<br />Oversized Fit.<br />Strictly Limited.
          </p>
        </div>
        <div>
          <p className="text-zinc-500 font-bold mb-4">Navigation</p>
          <div className="space-y-2">
            <Link href="/" className="block text-zinc-400 hover:text-white transition">Startseite</Link>
            <Link href="/shop" className="block text-zinc-400 hover:text-white transition">Shop</Link>
            <Link href="/news" className="block text-zinc-400 hover:text-white transition">News</Link>
            <Link href="/shop/challenges" className="block text-zinc-400 hover:text-white transition">Challenges</Link>
          </div>
        </div>
        <div>
          <p className="text-zinc-500 font-bold mb-4">Rechtliches</p>
          <div className="space-y-2">
            <Link href="/impressum" className="block text-zinc-400 hover:text-white transition">Impressum</Link>
            <Link href="/datenschutz" className="block text-zinc-400 hover:text-white transition">Datenschutz</Link>
            <Link href="/agb" className="block text-zinc-400 hover:text-white transition">AGB</Link>
            <Link href="/hilfe" className="block text-zinc-400 hover:text-white transition">Hilfe & FAQ</Link>
            <a href="https://discord.gg/T4RwVJRyRp" target="_blank" rel="noopener noreferrer"
              className="block text-zinc-400 hover:text-[#5865F2] transition">Discord</a>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-900 px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-[9px] text-zinc-600 uppercase tracking-widest">© {new Date().getFullYear()} Bellator Streetwear. Alle Rechte vorbehalten.</p>
        <p className="text-[9px] text-zinc-700 uppercase tracking-widest">Made with obsession.</p>
      </div>
    </footer>
  );
}
