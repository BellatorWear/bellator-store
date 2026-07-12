import { redirect } from "next/navigation";
import GlobalHeader from "@/app/components/GlobalHeader";
import GlobalFooter from "@/app/components/GlobalFooter";
import { getCurrentUser } from "@/app/actions";
import { daysUntilUsernameChangeAllowed } from "@/app/utils/username";
import ThemeToggle from "./ThemeToggle";
import NotificationToggle from "./NotificationToggle";
import NewsletterToggle from "./NewsletterToggle";
import UsernameEditor from "./UsernameEditor";
import Link from "next/link";
import ChangePasswordForm from "@/app/profil/ChangePasswordForm";

export default async function EinstellungenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const usernameCooldownDays = daysUntilUsernameChangeAllowed(user.usernameChangedAt);

  return (
    <div className="min-h-screen flex flex-col font-mono t-text"
      style={{ backgroundImage: 'url("/background.webp")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <div className="relative z-10 flex flex-col min-h-screen t-invert">
      <div className="absolute inset-0 bg-black/35 pointer-events-none z-0" />
        <GlobalHeader />
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="t-card border p-4 lg:col-span-2">
              <h1 className="text-2xl font-black uppercase tracking-tighter">Einstellungen</h1>
            </div>

            {/* Theme */}
            <section className="t-card border p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest t-muted">Erscheinungsbild</h2>
                  <p className="text-xs t-faint mt-1">Dark / Light Mode</p>
                </div>
                <ThemeToggle currentTheme={user.theme ?? "dark"} />
              </div>
            </section>

            {/* Benutzername */}
            <section className="t-card border p-4 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest t-muted">Benutzername</h2>
              <UsernameEditor
                currentUsername={user.username}
                cooldownDays={usernameCooldownDays}
              />
            </section>

            {/* Passwort */}
            <section className="t-card border p-4 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest t-muted">Passwort ändern</h2>
              <ChangePasswordForm />
            </section>

            {/* Push */}
            <section className="t-card border p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest t-muted">Push-Benachrichtigungen</h2>
                  <p className="text-xs t-faint mt-1">Direkt im Browser benachrichtigt werden</p>
                </div>
                <NotificationToggle initialEnabled={user.pushEnabled ?? false} />
              </div>
            </section>

            {/* Newsletter */}
            <section className="t-card border p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest t-muted">Newsletter</h2>
                  <p className="text-xs t-faint mt-1">Drops & Aktionen per Email</p>
                </div>
                <NewsletterToggle initialEnabled={user.newsletterOptIn ?? false} />
              </div>
            </section>

            {/* Info */}
            <section className="t-card border p-4 space-y-2 text-xs">
              <h2 className="font-bold uppercase tracking-widest t-muted">Konto</h2>
              <div className="flex justify-between py-1 border-b t-border-s">
                <span className="t-muted uppercase tracking-widest">Email</span>
                <span>{user.email}</span>
              </div>
              {user.isAdmin && (
                <div className="flex justify-between py-1 border-b t-border-s">
                  <span className="t-muted uppercase tracking-widest">Rolle</span>
                  <Link href="/admin" className="text-purple-400 font-bold hover:underline">Admin →</Link>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="t-muted uppercase tracking-widest">Discord</span>
                <a href="https://discord.gg/T4RwVJRyRp" target="_blank" rel="noopener noreferrer"
                  className="hover:text-[#5865F2] transition">discord.gg/T4RwVJRyRp</a>
              </div>
            </section>
          </div>
        </main>
        <GlobalFooter />
      </div>
    </div>
  );
}
