import { User } from "lucide-react";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col text-[#e0e0e0] font-mono"
      style={{
        backgroundImage: 'url("/background.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* HEADER */}
      <header className="bg-black border-b border-[#333] p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tighter italic">
          BELLATOR.
        </h1>
        <nav className="flex gap-8 uppercase text-sm items-center">
          <a href="/" className="hover:text-white">
            Startseite
          </a>
          <a
            href="/shop"
            className="hover:text-white underline underline-offset-4"
          >
            Shop
          </a>
          <a href="/mehr" className="hover:text-white">
            Mehr
          </a>
          <a
            href="/shop/profil"
            className="hover:text-white flex items-center gap-1"
          >
            <User size={16} />
            Profil
          </a>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow">{children}</main>

      {/* FOOTER */}
      <footer className="bg-black border-t border-[#333] p-8 grid grid-cols-2 gap-8 text-[10px] uppercase text-[#666]">
        <div>
          <p className="mb-2">Zahlungsmethoden</p>
          <div className="flex gap-2">
            <span>PAYPAL</span> <span>KLARNA</span> <span>VISA</span>
          </div>
        </div>
        <div className="text-right">
          <a href="/impressum" className="block hover:text-[#e0e0e0] cursor-pointer">
            Impressum
          </a>
          <a href="/shop/profil" className="block hover:text-[#e0e0e0] cursor-pointer">
            Hilfe
          </a>
        </div>
      </footer>
    </div>
  );
}
