import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { db } from "@/db";
import {
  orders,
  pointTransactions,
  userChallenges,
  challenges,
} from "@/db/schema";
import { eq } from "drizzle-orm";
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
        memberSince = date.toLocaleDateString("de-DE", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    } catch {}
  }

  const isAdmin = user.isAdmin;
  const discount = user.discountPercent;

  // Bestellhistorie laden
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id));

  // Punkte-Transaktionen laden
  const transactions = await db
    .select()
    .from(pointTransactions)
    .where(eq(pointTransactions.userId, user.id));

  // Abgeschlossene Challenges
  const completedChallenges = await db
    .select({ challenge: challenges, completedAt: userChallenges.completedAt })
    .from(userChallenges)
    .innerJoin(challenges, eq(userChallenges.challengeId, challenges.id))
    .where(eq(userChallenges.userId, user.id));

  return (
    <main
      className="min-h-screen text-[#e0e0e0] font-mono"
      style={{
        backgroundImage: 'url("/background.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <header className="bg-black border-b border-[#333] px-6 py-4 flex justify-between items-center">
        <a
          href="/shop"
          className="text-2xl font-bold tracking-tighter italic hover:opacity-80 transition"
        >
          BELLATOR.
        </a>
        <a
          href="/shop"
          className="text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition"
        >
          ← Zurück zum Shop
        </a>
      </header>

      <div className="flex justify-center p-6 md:p-16">
        <div className="w-full max-w-xl space-y-8">
          {/* Header */}
          <div className="bg-black/80 p-4">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">
              Mein Profil
            </h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">
              Account verwalten
            </p>
          </div>

          {/* Accountdaten */}
          <section className="border border-zinc-700 bg-black/80 p-6 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Accountdaten
            </h2>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 uppercase text-xs tracking-widest">
                Email
              </span>
              <span>{user.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 uppercase text-xs tracking-widest">
                Email bestätigt
              </span>
              <span>{user.emailVerified ? "Ja ✓" : "Nein"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 uppercase text-xs tracking-widest">
                Mitglied seit
              </span>
              <span>{memberSince}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 uppercase text-xs tracking-widest">
                Punkte
              </span>
              <span className="text-yellow-400 font-bold">
                {user.points ?? 0} Pkt.
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 uppercase text-xs tracking-widest">
                  Treuerabatt
                </span>
                <span className="text-green-400 font-bold">
                  {discount}% auf alle Bestellungen
                </span>
              </div>
            )}
            {isAdmin && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 uppercase text-xs tracking-widest">
                  Rolle
                </span>
                <span className="text-purple-400 font-bold uppercase tracking-widest">
                  Admin
                </span>
              </div>
            )}
          </section>

          {/* Bestellhistorie */}
          <section className="border border-zinc-700 bg-black/80 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Bestellhistorie
            </h2>
            {userOrders.length === 0 ? (
              <p className="text-xs text-zinc-600 uppercase tracking-widest">
                Noch keine Bestellungen.
              </p>
            ) : (
              <div className="space-y-3">
                {userOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-zinc-800 p-3 text-xs"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-400 uppercase tracking-widest">
                        Bestellung #{order.id}
                      </span>
                      <span className="text-zinc-400">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              "de-DE",
                            )
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="uppercase tracking-widest text-zinc-500">
                        {order.status}
                      </span>
                      <span className="font-bold">
                        {((order.total ?? 0) / 100).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Belege */}
          <section className="border border-zinc-700 bg-black/80 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Belege
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Sieh dir deine Belege ein und lade sie herunter.
              Passwortgeschützt.
            </p>
            <a
              href="/belege"
              className="inline-block border border-zinc-500 py-2 px-4 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition font-bold"
            >
              → Belege einsehen
            </a>
          </section>

          {/* Punkte & Challenges */}
          <section className="border border-zinc-700 bg-black/80 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Achievements & Challenges
            </h2>
            {completedChallenges.length === 0 ? (
              <p className="text-xs text-zinc-600 uppercase tracking-widest">
                Noch keine Challenges abgeschlossen.
              </p>
            ) : (
              <div className="space-y-2">
                {completedChallenges.map((c) => (
                  <div
                    key={c.challenge.id}
                    className="flex justify-between text-xs border border-zinc-800 p-3"
                  >
                    <div>
                      <p className="text-white uppercase tracking-widest">
                        {c.challenge.title}
                      </p>
                      <p className="text-zinc-500 mt-0.5">
                        {c.challenge.description}
                      </p>
                    </div>
                    <span className="text-yellow-400 font-bold whitespace-nowrap ml-4">
                      +{c.challenge.pointReward} Pkt.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Passwort ändern */}
          <section className="border border-zinc-700 bg-black/80 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Passwort ändern
            </h2>
            <ChangePasswordForm />
          </section>

          {/* Sitzung */}
          <section className="border border-zinc-700 bg-black/80 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Sitzung
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Dadurch wirst du auf diesem Gerät ausgeloggt.
            </p>
            <LogoutButton />
          </section>

          {/* Account löschen */}
          <section className="border border-red-900 bg-black/80 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-red-700 mb-4">
              Gefahrenzone
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Das Löschen deines Accounts ist unwiderruflich. Alle Daten werden
              permanent entfernt.
            </p>
            <DeleteAccountButton />
          </section>
        </div>
      </div>
    </main>
  );
}
