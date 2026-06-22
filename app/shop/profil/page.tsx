import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import ChangePasswordForm from "./ChangePasswordForm";
import LogoutButton from "./LogoutButton";

export default async function ProfilPage() {
  const user = await getCurrentUser();

  // Sollte wegen der Middleware nie passieren, aber sicher ist sicher.
  if (!user) {
    redirect("/");
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <main className="flex justify-center p-6 md:p-16">
      <div className="w-full max-w-xl space-y-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">
            Mein Profil
          </h1>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            Account verwalten
          </p>
        </div>

        <section className="border border-zinc-700 bg-black/60 backdrop-blur-md p-6 space-y-3">
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
        </section>

        <section className="border border-zinc-700 bg-black/60 backdrop-blur-md p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
            Passwort ändern
          </h2>
          <ChangePasswordForm />
        </section>

        <section className="border border-zinc-700 bg-black/60 backdrop-blur-md p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
            Sitzung
          </h2>
          <p className="text-xs text-zinc-500 mb-4">
            Dadurch wirst du auf diesem Gerät ausgeloggt.
          </p>
          <LogoutButton />
        </section>
      </div>
    </main>
  );
}
