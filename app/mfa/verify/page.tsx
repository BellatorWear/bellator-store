"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyMfaLogin } from "../actions";

export default function MfaVerifyPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !code.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("code", code.trim());
      const res = await verifyMfaLogin(fd);
      if (res?.error) { setErr(res.error); return; }
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error("MFA-Verifizierung fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center p-4 text-white site-bg">
      <div className="relative z-10 w-full max-w-[320px] sm:max-w-sm border border-zinc-700 p-6 sm:p-8 bg-black/60 backdrop-blur-md">
        <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tighter text-center uppercase border-b border-zinc-500 pb-4">
          Bellator
        </h1>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest text-center mb-6">
          Zwei-Faktor-Bestätigung
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            inputMode={useBackup ? "text" : "numeric"}
            maxLength={useBackup ? 11 : 6}
            className="w-full bg-black/80 border-b border-zinc-600 p-2 focus:border-white outline-none transition uppercase text-center placeholder:text-zinc-600 text-white tracking-[0.3em] text-lg"
            placeholder={useBackup ? "XXXXX-XXXXX" : "000000"}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-zinc-500 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50"
          >
            {loading ? "..." : "Bestätigen"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setUseBackup((v) => !v); setCode(""); setErr(""); }}
          className="w-full mt-4 text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition"
        >
          {useBackup ? "Stattdessen Authenticator-Code eingeben" : "Kein Zugriff auf die App? Backup-Code nutzen"}
        </button>

        {err && (
          <p className="mt-4 text-[10px] text-center uppercase tracking-widest text-red-600">{err}</p>
        )}
      </div>
    </main>
  );
}
