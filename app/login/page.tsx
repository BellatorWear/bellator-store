"use client";
import { useState } from "react";
import { handleAction } from "../actions";
import { useRouter } from "next/navigation";

function PasswordModal({ email, onDone }: { email: string; onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) { setErr("Mindestens 8 Zeichen."); return; }
    if (pw !== pw2) { setErr("Passwörter stimmen nicht überein."); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append("actionType", "setPassword");
    fd.append("password", pw);
    const res = await handleAction(fd);
    setLoading(false);
    if (res.error) { setErr(res.error); return; }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm border border-zinc-600 bg-black p-8">
        <h2 className="text-xl font-black uppercase tracking-tighter mb-2 text-white">Passwort setzen</h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">
          Lege jetzt dein Passwort fest{email ? ` für ${email}` : ""}.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="NEUES PASSWORT" required
            className="w-full bg-zinc-900 border-b border-zinc-600 p-2 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white" />
          <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="PASSWORT BESTÄTIGEN" required
            className="w-full bg-zinc-900 border-b border-zinc-600 p-2 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white" />
          {err && <p className="text-red-500 text-[10px] uppercase tracking-widest text-center">{err}</p>}
          <button type="submit" disabled={loading}
            className="w-full border border-zinc-500 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50 text-white">
            {loading ? "..." : "Passwort speichern"}
          </button>
        </form>
        <p className="mt-4 text-[10px] text-zinc-600 uppercase tracking-widest text-center">Mindestens 8 Zeichen erforderlich</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMsg(null);
    formData.append("actionType", "login");
    const res = await handleAction(formData);
    setLoading(false);
    if (res?.error) { setMsg({ text: res.error, type: "error" }); return; }
    if (res?.success === true) {
      if (res.mustSetPassword) {
        setCurrentEmail(res.email || "");
        setShowPasswordModal(true);
      } else {
        router.push("/shop");
      }
    }
  }

  async function handleGuest() {
    const fd = new FormData();
    fd.append("actionType", "guestLogin");
    const res = await handleAction(fd);
    if (res?.success) router.push("/shop");
  }

  return (
    <>
      <main className="relative flex min-h-[100dvh] items-center justify-center p-4 text-white">
        <div className="relative z-10 w-full max-w-[320px] sm:max-w-sm border border-zinc-700 p-6 sm:p-8 bg-black/60 backdrop-blur-md">
          <a href="/shop">
            <h1 className="text-3xl sm:text-4xl font-black mb-8 tracking-tighter text-center uppercase border-b border-zinc-500 pb-4 hover:opacity-80 transition">
              Bellator
            </h1>
          </a>
          <form action={handleSubmit} className="space-y-4">
            <input name="email" type="email" required
              className="w-full bg-black/80 border-b border-zinc-600 p-2 focus:border-white outline-none transition uppercase text-center placeholder:text-zinc-600 text-white"
              placeholder="E-MAIL" />
            <input name="password" type="password" required
              className="w-full bg-black/80 border-b border-zinc-600 p-2 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white"
              placeholder="PASSWORT" />
            <button type="submit" disabled={loading}
              className="w-full border border-zinc-500 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50">
              {loading ? "..." : "Einloggen"}
            </button>
          </form>
          <div className="mt-6 space-y-2">
            <a href="/accesskey" className="block w-full text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition text-center">
              Mit Access Key einloggen
            </a>
            <a href="/registrieren" className="block w-full text-[10px] text-zinc-400 uppercase tracking-widest hover:text-white transition text-center">
              Noch kein Account? Registrieren
            </a>
            <button onClick={handleGuest}
              className="w-full text-[10px] text-zinc-600 uppercase tracking-widest hover:text-white transition mt-2">
              Als Gast fortfahren →
            </button>
          </div>
          {msg && (
            <p className={`mt-4 text-[10px] text-center uppercase tracking-widest ${msg.type === "error" ? "text-red-600" : "text-green-500"}`}>
              {msg.text}
            </p>
          )}
        </div>
        <a href="/impressum" className="fixed bottom-4 right-4 text-[10px] text-zinc-600 uppercase tracking-widest hover:text-white transition z-20">
          Impressum
        </a>
      </main>
      {showPasswordModal && (
        <PasswordModal email={currentEmail} onDone={() => { setShowPasswordModal(false); router.push("/shop"); }} />
      )}
    </>
  );
}
