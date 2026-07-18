"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { handleAction } from "./actions";

export default function MethodSelectClient() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  async function handleGuest() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("actionType", "guestLogin");
      const res = await handleAction(fd);
      if (res?.success) window.location.href = next;
    } catch (e) {
      console.error("Gast-Login fehlgeschlagen:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative flex min-h-[100dvh] flex-col items-center justify-center p-4 text-white font-mono"
      style={{
        backgroundImage: 'url("/background.webp")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/35 z-0" />
      <div className="relative z-10 w-full max-w-[320px] sm:max-w-sm border border-zinc-700 p-6 sm:p-8 bg-black/60 backdrop-blur-md">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-1 text-center italic">Bellator.</h1>
        <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-8 text-center">
          Wie möchtest du fortfahren?
        </p>

        <div className="space-y-3">
          <Link href={`/login${nextQuery}`}
            className="block w-full border border-zinc-500 py-3 text-center font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Anmelden
          </Link>
          <Link href={`/accesskey${nextQuery}`}
            className="block w-full border border-zinc-500 py-3 text-center font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Access-Key Eingeben
          </Link>
          <Link href={`/registrieren${nextQuery}`}
            className="block w-full border border-zinc-500 py-3 text-center font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Registrieren
          </Link>
          <button onClick={handleGuest} disabled={loading}
            className="block w-full border border-zinc-500 py-3 text-center font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50">
            {loading ? "..." : "Als Gast fortfahren"}
          </button>
        </div>
      </div>

      {/* Impressum UNTER dem Kasten als normaler, statischer Element –
          nicht mehr als fixed-positioned, das auf Mobile in die Buttons
          ragte, wenn das Menü zentriert war und wenig Platz nach unten war. */}
      <div className="relative z-10 mt-6">
        <Link href="/impressum" className="text-[10px] text-white/40 uppercase tracking-widest hover:text-white transition">
          Impressum
        </Link>
      </div>
    </main>
  );
}
