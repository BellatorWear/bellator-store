export default function MehrPage() {
  return (
    <main className="min-h-screen text-[#e0e0e0] font-mono" style={{ backgroundImage: 'url("/background.png")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <header className="bg-black border-b border-[#333] px-6 py-4 flex justify-between items-center">
        <a href="/shop" className="text-2xl font-bold tracking-tighter italic hover:opacity-80 transition">BELLATOR.</a>
        <a href="/shop" className="text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition">← Zurück zum Shop</a>
      </header>
      <div className="flex justify-center p-4 sm:p-6 md:p-16">
        <div className="w-full max-w-xl space-y-8">
          <div className="bg-black/80 p-4">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-1">Mehr</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Über Bellator Streetwear</p>
          </div>
          <section className="border border-zinc-700 bg-black/80 p-6 space-y-4 text-sm leading-relaxed">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Über uns</h2>
            <p>Bellator Streetwear steht für kompromissloses Design, hochwertige Materialien und eine Ästhetik, die keine Erklärungen braucht.</p>
            <p>240g Heavy Cotton. Oversized Fit. Made for the streets.</p>
          </section>
          <section className="border border-zinc-700 bg-black/80 p-6 space-y-3 text-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">Links</h2>
            <a href="/impressum" className="block text-zinc-400 hover:text-white transition uppercase text-xs tracking-widest">→ Impressum</a>
            <a href="/hilfe" className="block text-zinc-400 hover:text-white transition uppercase text-xs tracking-widest">→ Hilfe & FAQ</a>
          </section>
        </div>
      </div>
    </main>
  );
}
