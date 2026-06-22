"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [msg, setMsg] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [email, setEmail] = useState("");

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
          setEmail(data.email);
          setStatus("success");
          if (data.mustSetPassword === false) {
            router.push("/shop");
          } else {
            setShowPasswordModal(true);
          }
        } else {
          setStatus("error");
          setMsg(data.error || "Token ungültig oder abgelaufen.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMsg("Fehler bei der Verifizierung.");
      });
  }, [searchParams]);

  if (showPasswordModal) {
    return <PasswordModal email={email} onDone={() => router.push("/shop")} />;
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-4 text-white">
      <div className="max-w-sm w-full border border-zinc-700 p-8 bg-black/60 backdrop-blur-md text-center">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-6">
          Bellator.
        </h1>
        {status === "loading" && (
          <p className="text-zinc-400 uppercase text-xs tracking-widest">
            Verifiziere...
          </p>
        )}
        {status === "success" && (
          <p className="text-green-500 uppercase text-xs tracking-widest">
            Email bestätigt!
          </p>
        )}
        {status === "error" && (
          <>
            <p className="text-red-500 uppercase text-xs tracking-widest mb-4">
              {msg}
            </p>
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

function PasswordModal({
  email,
  onDone,
}: {
  email: string;
  onDone: () => void;
}) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) {
      setErr("Mindestens 8 Zeichen.");
      return;
    }
    if (pw !== pw2) {
      setErr("Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setErr(data.error);
      return;
    }
    onDone();
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-4 text-white">
      <div className="w-full max-w-sm border border-zinc-600 bg-black p-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">
          Bellator.
        </h1>
        <h2 className="text-lg font-black uppercase tracking-tighter mb-2">
          Passwort setzen
        </h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">
          Email bestätigt! Lege jetzt dein Passwort fest.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="NEUES PASSWORT"
            required
            className="w-full bg-zinc-900 border-b border-zinc-600 p-2 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white"
          />
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="PASSWORT BESTÄTIGEN"
            required
            className="w-full bg-zinc-900 border-b border-zinc-600 p-2 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white"
          />
          {err && (
            <p className="text-red-500 text-[10px] uppercase tracking-widest text-center">
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-zinc-500 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50"
          >
            {loading ? "..." : "Passwort speichern & einloggen"}
          </button>
        </form>
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
