import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import ThemeToggle from "./ThemeToggle";

export default async function EinstellungenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen text-[#e0e0e0] font-mono" style={{ backgroundImage: 'url("/background.png")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <header className="bg-black border-b border-[#333] px-6 py-4 flex justify-between items-center">
        <a href="/shop" className="text-2xl font-bold tracking-tighter italic hover:opacity-80 transition">BELLATOR.</a>
        <a href="/shop" className="text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition">← Zurück zum Shop</a>
      </header>
      <div className="flex justify-center p-6 md:p-16">
        <div className="w-full max-w-xl space-y-8">
          <div className="bg-black/80 p-4">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">Einstellungen</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">App-Einstellungen verwalten</p>
          </div>
          <section className="border border-zinc-700 bg-black/80 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Darstellung</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-white uppercase tracking-widest">Dark / Light Mode</p>
                <p className="text-xs text-zinc-500 mt-1">Wechsle zwischen hellem und dunklem Design.</p>
              </div>
              <ThemeToggle currentTheme={user.theme ?? "dark"} />
            </div>
          </section>
          <section className="border border-zinc-700 bg-black/80 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Account</h2>
            <a href="/profil" className="text-xs text-zinc-400 uppercase tracking-widest hover:text-white transition">
              → Profil & Accountdaten verwalten
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
