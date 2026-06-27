"use client";
import { useState } from "react";
import { handleAction } from "./actions";

export default function PasswordSetupModal({ email, onDone }: { email?: string; onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) { setErr("Mindestens 8 Zeichen."); return; }
    if (pw !== pw2) { setErr("Passwörter stimmen nicht überein."); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("actionType", "setPassword");
      fd.append("password", pw);
      const res = await handleAction(fd);
      if (res?.error) { setErr(res.error); return; }
      onDone();
    } catch (e) {
      console.error("Passwort setzen fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm border border-zinc-600 bg-black p-8">
      <h2 className="text-xl font-black uppercase tracking-tighter mb-2 text-white">Passwort setzen</h2>
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">
        Lege jetzt dein Passwort fest{email ? ` für ${email}` : ""}.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div className="relative">
          <input type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="NEUES PASSWORT" required
            className="w-full bg-zinc-900 border-b border-zinc-600 p-2 pr-9 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white" />
          <button type="button" onClick={() => setShowPw((s) => !s)} tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition">
            {showPw ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        <input type={showPw ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="PASSWORT BESTÄTIGEN" required
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

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
