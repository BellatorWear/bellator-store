import { User, Settings } from "lucide-react";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col text-[#e0e0e0] font-mono"
      style={{ backgroundImage: 'url("/background.png")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <header className="bg-black border-b border-[#333] px-6 py-4 flex justify-between items-center">
        <a href="/shop" className="text-2xl font-bold tracking-tighter italic hover:opacity-80 transition">
          BELLATOR.
        </a>
        <nav className="flex gap-6 uppercase text-sm items-center">
          <a href="/shop" className="hover:text-white underline underline-offset-4 hidden sm:block">Shop</a>
          <a href="/mehr" className="hover:text-white hidden sm:block">Mehr</a>
          <a href="/einstellungen" className="hover:text-white flex items-center" title="Einstellungen">
            <span className="border border-zinc-600 p-1.5 hover:border-white transition">
              <Settings size={14} />
            </span>
          </a>
          <a href="/profil" className="hover:text-white flex items-center" title="Profil">
            <span className="border border-zinc-600 p-1.5 hover:border-white transition">
              <User size={14} />
            </span>
          </a>
        </nav>
      </header>
      <main className="flex-grow">{children}</main>
      <footer className="bg-black border-t border-[#333] p-8 grid grid-cols-2 gap-8 text-[10px] uppercase text-[#666]">
        <div>
          <p className="mb-2">Zahlungsmethoden</p>
          <div className="flex gap-2"><span>PAYPAL</span><span>KLARNA</span><span>VISA</span></div>
        </div>
        <div className="text-right">
          <a href="/impressum" className="block hover:text-[#e0e0e0] cursor-pointer mb-1">Impressum</a>
          <a href="/hilfe" className="block hover:text-[#e0e0e0] cursor-pointer">Hilfe</a>
        </div>
      </footer>
    </div>
  );
}
