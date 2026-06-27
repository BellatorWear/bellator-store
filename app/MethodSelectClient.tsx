"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { handleAction } from "./actions";

export default function MethodSelectClient() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGuest() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("actionType", "guestLogin");
      const res = await handleAction(fd);
      if (res?.success) router.push("/shop");
    } catch (e) {
      console.error("Gast-Login fehlgeschlagen:", e);
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
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-1 text-center italic">Bellator.</h1>
        <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-8 text-center">
          Wie möchtest du fortfahren?
        </p>

        <div className="space-y-3">
          <Link href="/login"
            className="block w-full border border-zinc-500 py-3 text-center font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Anmelden
          </Link>
          <Link href="/accesskey"
            className="block w-full border border-zinc-500 py-3 text-center font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Access-Key Eingeben
          </Link>
          <Link href="/registrieren"
            className="block w-full border border-zinc-500 py-3 text-center font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Registrieren
          </Link>
          <button onClick={handleGuest} disabled={loading}
            className="block w-full border border-zinc-500 py-3 text-center font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50">
            {loading ? "..." : "Als Gast fortfahren"}
          </button>
        </div>

        <Link href="/impressum" className="fixed bottom-4 right-4 text-[10px] text-white/40 uppercase tracking-widest hover:text-white transition z-20">
          Impressum
        </Link>
      </div>
    </main>
  );
}
