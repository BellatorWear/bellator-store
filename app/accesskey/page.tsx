"use client";
import { useState } from "react";
import { handleAction } from "../actions";

// Nach erfolgreichem Login übernimmt ausschließlich der globale
// ProfileSetupGuard (Root-Layout) das Passwort/Username-Setup - siehe
// Kommentar in app/login/page.tsx für den Hintergrund.
export default function AccessKeyPage() {
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMsg(null);
    try {
      formData.append("actionType", "loginWithKey");
      const res = await handleAction(formData);
      if (res?.error) { setMsg({ text: res.error, type: "error" }); return; }
      if (res?.success === true) window.location.href = "/";
    } catch (e) {
      console.error("Login mit Access Key fehlgeschlagen:", e);
      setMsg({ text: "Fehler. Bitte nochmal versuchen.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative flex min-h-[100dvh] items-center justify-center p-4 text-white font-mono"
      style={{
        backgroundImage: 'url("/background.webp")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="relative z-10 w-full max-w-[320px] sm:max-w-sm border border-zinc-700 p-6 sm:p-8 bg-black/60 backdrop-blur-md">
        <a href="/login">
          <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tighter text-center uppercase border-b border-zinc-500 pb-4 hover:opacity-80 transition italic">
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
  );
}
