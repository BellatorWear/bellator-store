"use client";
import { useState } from "react";
import { handleAction } from "../actions";
import { useRouter } from "next/navigation";

export default function AccessKeyPage() {
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMsg(null);
    formData.append("actionType", "loginWithKey");
    const res = await handleAction(formData);
    setLoading(false);
    if (res?.error) { setMsg({ text: res.error, type: "error" }); return; }
    if (res?.success === true) {
      if (res.mustSetPassword) { setCurrentEmail(res.email || ""); setShowPasswordModal(true); }
      else router.push("/shop");
    }
  }

  return (
    <>
      <main className="relative flex min-h-[100dvh] items-center justify-center p-4 text-white">
        <div className="relative z-10 w-full max-w-[320px] sm:max-w-sm border border-zinc-700 p-6 sm:p-8 bg-black/60 backdrop-blur-md">
          <a href="/login">
            <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tighter text-center uppercase border-b border-zinc-500 pb-4 hover:opacity-80 transition">
              Bellator
            </h1>
          </a>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest text-center mb-6">Access Key eingeben</p>
          <form action={handleSubmit} className="space-y-4">
            <input name="accessKey" type="text" required maxLength={10}
              className="w-full bg-black/80 border-b border-zinc-600 p-2 focus:border-white outline-none transition uppercase text-center placeholder:text-zinc-600 text-white tracking-widest"
              placeholder="ACCESS KEY" />
            <button type="submit" disabled={loading}
              className="w-full border border-zinc-500 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50">
              {loading ? "..." : "Einloggen"}
            </button>
          </form>
          <a href="/login" className="mt-6 block w-full text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition text-center">
            ← Zurück zum Login
          </a>
          {msg && (
            <p className={`mt-4 text-[10px] text-center uppercase tracking-widest ${msg.type === "error" ? "text-red-600" : "text-green-500"}`}>
              {msg.text}
            </p>
          )}
        </div>
      </main>
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <PasswordModal email={currentEmail} onDone={() => { setShowPasswordModal(false); router.push("/shop"); }} />
        </div>
      )}
    </>
  );
}

function PasswordModal({ email, onDone }: { email: string; onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { useRouter } = require("next/navigation");

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
    <div className="w-full max-w-sm border border-zinc-600 bg-black p-8">
      <h2 className="text-xl font-black uppercase tracking-tighter mb-2 text-white">Passwort setzen</h2>
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">Lege jetzt dein Passwort fest{email ? ` für ${email}` : ""}.</p>
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
    </div>
  );
}
