"use client";

import { useState } from "react";
import { handleAction } from "./actions";
import { useRouter } from "next/navigation";

type Mode = "login" | "request" | "key";

export default function Home() {
  const [mode, setMode] = useState<Mode>("login");
  const [msg, setMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMsg(null);

    if (mode === "login") formData.append("actionType", "login");
    else if (mode === "key") formData.append("actionType", "loginWithKey");
    else formData.append("actionType", "request");

    const res = await handleAction(formData);
    setLoading(false);

    if (res?.error) {
      setMsg({ text: res.error, type: "error" });
    } else if (res?.success === true) {
      if (res.mustSetPassword) {
        const email = formData.get("email") as string;
        setCurrentEmail(email || "");
        setShowPasswordModal(true);
      } else {
        router.push("/shop");
      }
    } else if (res?.success) {
      setMsg({ text: res.success as string, type: "success" });
    }
  }

  return (
    <>
      <main className="relative flex min-h-[100dvh] items-center justify-center p-4 text-white">
        <div className="relative z-10 w-full max-w-[320px] sm:max-w-sm border border-zinc-700 p-6 sm:p-8 bg-black/60 backdrop-blur-md">
          <h1 className="text-3xl sm:text-4xl font-black mb-8 tracking-tighter text-center uppercase border-b border-zinc-500 pb-4">
            Bellator
          </h1>

          <form action={handleSubmit} className="space-y-4">
            {/* LOGIN: Email + Passwort */}
            {mode === "login" && (
              <>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full bg-black/80 border-b border-zinc-600 p-2 focus:border-white outline-none transition uppercase text-center placeholder:text-zinc-600 text-white"
                  placeholder="EMAIL"
                />
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full bg-black/80 border-b border-zinc-600 p-2 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white"
                  placeholder="PASSWORT"
                />
              </>
            )}

            {/* ACCESS KEY LOGIN */}
            {mode === "key" && (
              <input
                name="accessKey"
                type="text"
                required
                maxLength={10}
                className="w-full bg-black/80 border-b border-zinc-600 p-2 focus:border-white outline-none transition uppercase text-center placeholder:text-zinc-600 text-white tracking-widest"
                placeholder="ACCESS KEY"
              />
            )}

            {/* EMAIL ANFORDERN */}
            {mode === "request" && (
              <input
                name="email"
                type="email"
                required
                className="w-full bg-black/80 border-b border-zinc-600 p-2 focus:border-white outline-none transition uppercase text-center placeholder:text-zinc-600 text-white"
                placeholder="EMAIL ADDRESS"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full border border-zinc-500 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50"
            >
              {loading
                ? "..."
                : mode === "login"
                  ? "Einloggen"
                  : mode === "key"
                    ? "Enter Key"
                    : "Zugang Anfordern"}
            </button>
          </form>

          {/* Navigation */}
          <div className="mt-6 space-y-2">
            {mode !== "login" && (
              <button
                onClick={() => {
                  setMode("login");
                  setMsg(null);
                }}
                className="w-full text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition"
              >
                ← Zurück zum Login
              </button>
            )}
            {mode === "login" && (
              <>
                <button
                  onClick={() => {
                    setMode("key");
                    setMsg(null);
                  }}
                  className="w-full text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition"
                >
                  Mit Access Key einloggen
                </button>
                <button
                  onClick={() => {
                    setMode("request");
                    setMsg(null);
                  }}
                  className="w-full text-[10px] text-zinc-400 uppercase tracking-widest hover:text-white transition"
                >
                  Zugang anfordern
                </button>
              </>
            )}
          </div>

          {msg && (
            <p
              className={`mt-4 text-[10px] text-center uppercase tracking-widest ${msg.type === "error" ? "text-red-600" : "text-green-500"}`}
            >
              {msg.text}
            </p>
          )}
        </div>
      </main>

      {/* Passwort setzen Modal */}
      {showPasswordModal && (
        <PasswordModal
          email={currentEmail}
          onDone={() => {
            setShowPasswordModal(false);
            router.push("/shop");
          }}
        />
      )}
    </>
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
    const fd = new FormData();
    fd.append("actionType", "setPassword");
    fd.append("email", email);
    fd.append("password", pw);
    const res = await handleAction(fd);
    setLoading(false);

    if (res.error) {
      setErr(res.error);
      return;
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm border border-zinc-600 bg-black p-8">
        <h2 className="text-xl font-black uppercase tracking-tighter mb-2">
          Passwort setzen
        </h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">
          Lege jetzt dein persönliches Passwort fest.
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
            {loading ? "..." : "Passwort speichern"}
          </button>
        </form>
        <p className="mt-4 text-[10px] text-zinc-600 uppercase tracking-widest text-center">
          Mindestens 8 Zeichen erforderlich
        </p>
      </div>
    </div>
  );
}
