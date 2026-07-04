"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

// Nach erfolgreicher Verifizierung übernimmt ausschließlich der globale
// ProfileSetupGuard (Root-Layout) das Passwort/Username-Setup - siehe
// Kommentar in app/login/page.tsx für den Hintergrund (vorher hatte diese
// Seite ihren EIGENEN Passwort/Username-Ablauf parallel zum globalen
// Guard, was zu einer Endlosschleife führen konnte). window.location.href
// statt router.push erzwingt einen frischen Server-Roundtrip.
function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMsg("Kein Token gefunden.");
      return;
    }

    fetch(`/api/verify-email?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          window.location.href = "/";
        } else {
          setStatus("error");
          setMsg(data.error || "Token ungültig oder abgelaufen.");
        }
      })
      .catch((e) => {
        console.error("Email-Verifizierung fehlgeschlagen:", e);
        setStatus("error");
        setMsg("Fehler bei der Verifizierung.");
      });
  }, [searchParams]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-4 text-white">
      <div className="max-w-sm w-full border border-zinc-700 p-8 bg-black/60 backdrop-blur-md text-center">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-6">Bellator.</h1>
        {status === "loading" && (
          <p className="text-zinc-400 uppercase text-xs tracking-widest">Verifiziere...</p>
        )}
        {status === "success" && (
          <p className="text-green-500 uppercase text-xs tracking-widest">Email bestätigt! Wird weitergeleitet...</p>
        )}
        {status === "error" && (
          <>
            <p className="text-red-500 uppercase text-xs tracking-widest mb-4">{msg}</p>
            <button
              onClick={() => router.push("/")}
              className="text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition"
            >
              Zurück zum Login
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center text-white">
          <p className="uppercase text-xs tracking-widest">Laden...</p>
        </main>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
