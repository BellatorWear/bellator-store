import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import ThemeToggle from "./ThemeToggle";
import NotificationToggle from "./NotificationToggle";

export default async function EinstellungenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen font-mono t-text"
      style={{ backgroundImage: 'url("/background.png")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <div className="fixed inset-0 bg-black/50 pointer-events-none z-0" />
      <header className="relative z-10 t-header border-b px-6 py-4 flex justify-between items-center">
        <a href="/shop" className="text-2xl font-black tracking-tighter italic t-text hover:opacity-70 transition">BELLATOR.</a>
        <a href="/shop" className="text-[10px] t-muted uppercase tracking-widest hover:t-text transition">← Zurück zum Shop</a>
      </header>

      <div className="relative z-10 flex justify-center p-6 md:p-16">
        <div className="w-full max-w-xl space-y-6">

          <div className="t-card border p-4">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">Einstellungen</h1>
            <p className="text-xs t-muted uppercase tracking-widest">App-Einstellungen verwalten</p>
          </div>

          <section className="t-card border p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest t-muted">Darstellung</h2>
            <div className="flex justify-between items-center py-2 border-b t-border-s">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">Dark / Light Mode</p>
                <p className="text-xs t-muted mt-0.5">Wechsle zwischen hellem und dunklem Design.</p>
              </div>
              <ThemeToggle currentTheme={user.theme ?? "dark"} />
            </div>
          </section>

          <section className="t-card border p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest t-muted">Benachrichtigungen</h2>
            <div className="flex justify-between items-center py-2 border-b t-border-s">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">Push-Benachrichtigungen</p>
                <p className="text-xs t-muted mt-0.5">Werde bei neuen Drops und Aktionen benachrichtigt.</p>
              </div>
              <NotificationToggle />
            </div>
            <div className="py-2">
              <p className="text-sm font-bold uppercase tracking-widest mb-0.5">Werbe-Emails</p>
              <p className="text-xs t-muted mb-2">
                Verwalte deine Email-Einstellungen in deinem{" "}
                <a href="/profil" className="underline hover:t-text transition">Profil →</a>
              </p>
            </div>
          </section>

          <section className="t-card border p-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest t-muted">Datenschutz</h2>
            <p className="text-xs t-muted py-2">
              Wir nutzen nur notwendige Cookies (Session, Theme). Keine Tracking-Cookies.
            </p>
          </section>

          <section className="t-card border p-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest t-muted">Account</h2>
            <a href="/profil" className="block text-xs t-muted uppercase tracking-widest hover:t-text transition">→ Profil & Accountdaten</a>
            <a href="/belege" className="block text-xs t-muted uppercase tracking-widest hover:t-text transition">→ Meine Belege</a>
            <a href="/shop/challenges" className="block text-xs t-muted uppercase tracking-widest hover:t-text transition">→ Challenges & Punkte</a>
          </section>

          <section className="t-card border p-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest t-muted">Info</h2>
            <div className="flex justify-between text-xs py-1 border-b t-border-s">
              <span className="t-muted uppercase tracking-widest">Version</span><span>1.0.0</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="t-muted uppercase tracking-widest">Discord</span>
              <a href="https://discord.gg/T4RwVJRyRp" target="_blank" rel="noopener noreferrer"
                className="hover:text-[#5865F2] transition">discord.gg/T4RwVJRyRp</a>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
