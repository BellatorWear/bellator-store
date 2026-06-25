import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { db } from "@/db";
import { orders, userChallenges, challenges, userRewards, rewards } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import LogoutButton from "./LogoutButton";
import ChangePasswordForm from "./ChangePasswordForm";
import DeleteAccountButton from "./DeleteAccountButton";

export default async function ProfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let memberSince = "Frühmitglied";
  if (user.createdAt) {
    try {
      const date = new Date(user.createdAt);
      if (!isNaN(date.getTime())) {
        memberSince = date.toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" });
      }
    } catch {}
  }

  const isAdmin = user.isAdmin;
  const discount = user.discountPercent;

  // Bestellhistorie - mit Fehlerbehandlung
  let userOrders: Array<{ id: number; total: number; status: string | null; createdAt: Date | null }> = [];
  try {
    userOrders = await db.select().from(orders).where(eq(orders.userId, user.id));
  } catch {}

  // Challenges - mit Fehlerbehandlung
  let completedChallenges: Array<{ challenge: { id: number; title: string; description: string; pointReward: number }; completedAt: Date | null }> = [];
  try {
    completedChallenges = await db
      .select({ challenge: challenges, completedAt: userChallenges.completedAt })
      .from(userChallenges)
      .innerJoin(challenges, eq(userChallenges.challengeId, challenges.id))
      .where(eq(userChallenges.userId, user.id));
  } catch {}

  // Abzeichen (Badge-Prämien) - mit Fehlerbehandlung
  let badges: Array<{ id: number; title: string; description: string }> = [];
  try {
    const badgeRewards = await db
      .select({ reward: rewards })
      .from(userRewards)
      .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
      .where(and(eq(userRewards.userId, user.id), eq(rewards.type, "badge")));
    badges = badgeRewards.map(b => b.reward);
  } catch {}

  return (
    <main className="min-h-screen t-text font-mono"
      style={{ backgroundImage: 'url("/background.png")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <div className="fixed inset-0 bg-black/50 pointer-events-none z-0" />

      <header className="relative z-10 t-header border-b px-4 sm:px-6 py-4 flex justify-between items-center">
        <a href="/shop" className="text-xl sm:text-2xl font-black tracking-tighter italic t-text hover:opacity-70 transition">BELLATOR.</a>
        <a href="/shop" className="text-[10px] t-muted uppercase tracking-widest hover:t-text transition">← Zurück zum Shop</a>
      </header>

      <div className="relative z-10 flex justify-center p-4 sm:p-6 md:p-16">
        <div className="w-full max-w-xl space-y-6">

          <div className="t-card border p-4">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-1">Mein Profil</h1>
            <p className="text-xs t-muted uppercase tracking-widest">Account verwalten</p>
          </div>

          {/* Accountdaten */}
          <section className="t-card border p-5 sm:p-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest t-muted mb-2">Accountdaten</h2>
            <div className="flex justify-between text-sm gap-4">
              <span className="t-muted uppercase text-xs tracking-widest shrink-0">Email</span>
              <span className="text-right break-all">{user.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="t-muted uppercase text-xs tracking-widest">Email bestätigt</span>
              <span>{user.emailVerified ? "Ja ✓" : "Nein"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="t-muted uppercase text-xs tracking-widest">Mitglied seit</span>
              <span>{memberSince}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="t-muted uppercase text-xs tracking-widest">Punkte</span>
              <span className="text-yellow-400 font-bold">{user.points ?? 0} Pkt.</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="t-muted uppercase text-xs tracking-widest">Treuerabatt</span>
                <span className="text-green-400 font-bold">{discount}% auf alle Bestellungen</span>
              </div>
            )}
            {isAdmin && (
              <div className="flex justify-between text-sm">
                <span className="t-muted uppercase text-xs tracking-widest">Rolle</span>
                <span className="text-purple-400 font-bold uppercase tracking-widest">Admin</span>
              </div>
            )}
          </section>

          {/* Bestellhistorie */}
          <section className="t-card border p-5 sm:p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest t-muted mb-4">Bestellhistorie</h2>
            {userOrders.length === 0 ? (
              <p className="text-xs t-faint uppercase tracking-widest">Noch keine Bestellungen.</p>
            ) : (
              <div className="space-y-3">
                {userOrders.map(order => (
                  <div key={order.id} className="border t-border-s p-3 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="t-muted uppercase tracking-widest">Bestellung #{order.id}</span>
                      <span className="t-muted">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("de-DE") : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="uppercase tracking-widest t-faint">{order.status}</span>
                      <span className="font-bold">{((order.total ?? 0) / 100).toFixed(2)} €</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Belege */}
          <section className="t-card border p-5 sm:p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest t-muted mb-4">Belege</h2>
            <p className="text-xs t-muted mb-4">Sieh dir deine Belege ein und lade sie herunter. Passwortgeschützt.</p>
            <a href="/belege" className="inline-block border t-border py-2 px-4 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition font-bold t-text">
              → Belege einsehen
            </a>
          </section>

          {/* Challenges */}
          <section className="t-card border p-5 sm:p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest t-muted mb-4">Achievements & Challenges</h2>
            {completedChallenges.length === 0 ? (
              <p className="text-xs t-faint uppercase tracking-widest">Noch keine Challenges abgeschlossen.</p>
            ) : (
              <div className="space-y-2">
                {completedChallenges.map(c => (
                  <div key={c.challenge.id} className="flex justify-between text-xs border t-border-s p-3">
                    <div>
                      <p className="t-text uppercase tracking-widest">{c.challenge.title}</p>
                      <p className="t-muted mt-0.5">{c.challenge.description}</p>
                    </div>
                    <span className="text-yellow-400 font-bold whitespace-nowrap ml-4">+{c.challenge.pointReward} Pkt.</span>
                  </div>
                ))}
              </div>
            )}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {badges.map(b => (
                  <span key={b.id} title={b.description}
                    className="border border-yellow-800 bg-yellow-900/10 text-yellow-400 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5">
                    🏅 {b.title}
                  </span>
                ))}
              </div>
            )}
            <a href="/shop/challenges" className="inline-block mt-4 text-xs underline hover:t-text transition t-muted">
              → Alle Challenges & Prämien ansehen
            </a>
          </section>

          {/* Passwort ändern */}
          <section className="t-card border p-5 sm:p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest t-muted mb-4">Passwort ändern</h2>
            <ChangePasswordForm />
          </section>

          {/* Sitzung */}
          <section className="t-card border p-5 sm:p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest t-muted mb-4">Sitzung</h2>
            <p className="text-xs t-muted mb-4">Dadurch wirst du auf diesem Gerät ausgeloggt.</p>
            <LogoutButton />
          </section>

          {/* Account löschen */}
          <section className="border border-red-900 bg-black/80 p-5 sm:p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-red-700 mb-4">Gefahrenzone</h2>
            <p className="text-xs t-muted mb-4">Das Löschen deines Accounts ist unwiderruflich. Alle Daten werden permanent entfernt.</p>
            <DeleteAccountButton />
          </section>

        </div>
      </div>
    </main>
  );
}
