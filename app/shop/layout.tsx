import { User, Settings } from "lucide-react";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-mono"
      style={{ backgroundImage: 'url("/background.png")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>

      {/* Dunkler Overlay für Lesbarkeit */}
      <div className="fixed inset-0 bg-black/50 z-0 pointer-events-none" />

      <header className="relative z-10 t-header border-b px-6 py-4 flex justify-between items-center">
        <a href="/shop" className="text-2xl font-black tracking-tighter italic t-text hover:opacity-70 transition">
          BELLATOR.
        </a>
        <nav className="flex gap-4 items-center">
          <a href="/shop" className="hidden sm:block text-xs uppercase tracking-widest t-muted hover:t-text transition">Shop</a>
          <a href="/shop/challenges" className="hidden sm:block text-xs uppercase tracking-widest t-muted hover:t-text transition">Challenges</a>
          <a href="/mehr" className="hidden sm:block text-xs uppercase tracking-widest t-muted hover:t-text transition">Mehr</a>
          <a href="https://discord.gg/T4RwVJRyRp" target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs uppercase tracking-widest t-muted hover:text-[#5865F2] transition" title="Discord">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.102 18.079.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Discord
          </a>
          <a href="/einstellungen" className="t-muted hover:t-text flex items-center" title="Einstellungen">
            <span className="border t-border p-1.5 hover:border-white transition"><Settings size={14} /></span>
          </a>
          <a href="/profil" className="t-muted hover:t-text flex items-center" title="Profil">
            <span className="border t-border p-1.5 hover:border-white transition"><User size={14} /></span>
          </a>
        </nav>
      </header>

      <main className="relative z-10 flex-grow">{children}</main>

      <footer className="relative z-10 t-footer border-t p-8 text-[10px] uppercase">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Zahlungsmethoden mit Logos */}
          <div>
            <p className="t-muted mb-4 tracking-widest">Zahlungsmethoden</p>
            <div className="flex flex-wrap gap-3">
              {/* PayPal */}
              <div className="flex flex-col items-center gap-1">
                <div className="border t-border px-3 py-2 t-card">
                  <svg width="40" height="16" viewBox="0 0 124 33" fill="none">
                    <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.97-1.142-2.694-1.746-4.985-1.746z" fill="#253B80"/>
                    <path d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.clustered.52a.95.95 0 0 0 .94-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.506 0 7.105-2.18 7.785-6.5.305-1.89.012-3.375-.873-4.415-.97-1.142-2.694-1.746-4.985-1.746z" fill="#179BD7"/>
                  </svg>
                </div>
                <span className="t-muted tracking-widest">PayPal</span>
              </div>
              {/* Klarna */}
              <div className="flex flex-col items-center gap-1">
                <div className="border t-border px-3 py-2 t-card bg-[#FFB3C7]/20">
                  <span className="font-black text-[#FF699A] text-sm tracking-tight">klarna</span>
                </div>
                <span className="t-muted tracking-widest">Klarna</span>
              </div>
              {/* Visa */}
              <div className="flex flex-col items-center gap-1">
                <div className="border t-border px-3 py-2 t-card">
                  <span className="font-black text-[#1A1F71] text-sm italic tracking-tight bg-white px-1">VISA</span>
                </div>
                <span className="t-muted tracking-widest">Visa</span>
              </div>
              {/* Mastercard */}
              <div className="flex flex-col items-center gap-1">
                <div className="border t-border px-3 py-2 t-card flex gap-0.5">
                  <div className="w-5 h-5 rounded-full bg-red-500 opacity-90" />
                  <div className="w-5 h-5 rounded-full bg-yellow-400 opacity-90 -ml-2" />
                </div>
                <span className="t-muted tracking-widest">Mastercard</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="t-muted mb-4 tracking-widest">Links</p>
            <div className="space-y-2">
              <a href="/impressum" className="block t-muted hover:t-text transition">Impressum</a>
              <a href="/hilfe" className="block t-muted hover:t-text transition">Hilfe & FAQ</a>
              <a href="https://discord.gg/T4RwVJRyRp" target="_blank" rel="noopener noreferrer"
                className="block t-muted hover:text-[#5865F2] transition">Discord</a>
            </div>
          </div>

          {/* About */}
          <div>
            <p className="t-muted mb-4 tracking-widest">Bellator Streetwear</p>
            <p className="t-faint leading-relaxed normal-case text-[10px]">
              240g Heavy Cotton. Oversized Fit. Strictly Limited.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
