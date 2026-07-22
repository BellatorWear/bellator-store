"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { handleAction } from "../actions";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMsg(null);
    formData.append("actionType", "resetPasswordWithToken");
    formData.append("token", token);
    try {
      const res = await handleAction(formData);
      if (res?.error) { setMsg({ text: res.error as string, type: "error" }); return; }
      if (res?.success) {
        setDone(true);
        setTimeout(() => { window.location.href = "/"; }, 1500);
      }
    } catch (e) {
      console.error("Passwort zurücksetzen fehlgeschlagen:", e);
      setMsg({ text: "Fehler. Bitte nochmal versuchen.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="relative flex min-h-[100dvh] items-center justify-center p-4 text-white site-bg">
        <div className="relative z-10 w-full max-w-[320px] sm:max-w-sm border border-zinc-700 p-6 sm:p-8 bg-black/60 backdrop-blur-md text-center space-y-4">
          <p className="text-xs text-zinc-400 uppercase tracking-widest">Kein gültiger Reset-Link.</p>
          <a href="/passwort-vergessen"
            className="block w-full border border-zinc-500 py-3 text-center text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all">
            Neuen Link anfordern
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center p-4 text-white site-bg">
      <div className="relative z-10 w-full max-w-[320px] sm:max-w-sm border border-zinc-700 p-6 sm:p-8 bg-black/60 backdrop-blur-md">
        <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tighter text-center uppercase border-b border-zinc-500 pb-4">
          Bellator
        </h1>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest text-center mb-6">
          Neues Passwort setzen
        </p>

        {done ? (
          <p className="text-[10px] text-green-500 text-center uppercase tracking-widest">
            ✓ Passwort gesetzt - du wirst eingeloggt...
          </p>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                name="newPassword"
                type={showPw ? "text" : "password"}
                required
                minLength={8}
                maxLength={72}
                className="w-full bg-black/80 border-b border-zinc-600 p-2 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white"
                placeholder="NEUES PASSWORT"
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white" onClick={() => setShowPw((s) => !s)} tabIndex={-1}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full border border-zinc-500 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50"
            >
              {loading ? "..." : "Passwort speichern"}
            </button>
          </form>
        )}

        {msg && (
          <p className={`mt-4 text-[10px] text-center uppercase tracking-widest ${msg.type === "error" ? "text-red-600" : "text-green-500"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
