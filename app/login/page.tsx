"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { handleAction } from "../actions";
import { Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  // Nach erfolgreichem Login übernimmt AUSSCHLIESSLICH der globale
  // ProfileSetupGuard (im Root-Layout) das Abfragen von Passwort/Username,
  // falls nötig - es gibt jetzt nur noch EINE Stelle, die das macht (vorher
  // hatte diese Seite ihren EIGENEN Passwort/Username-Ablauf parallel zum
  // globalen Guard, was zu einer Endlosschleife führen konnte). Ein harter
  // Reload statt router.push garantiert außerdem frische Server-Daten.
  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMsg(null);
    formData.append("actionType", "login");
    try {
      const res = await handleAction(formData);
      if (res?.error) { setMsg({ text: res.error, type: "error" }); return; }
      if (res?.success === true) window.location.href = next;
    } catch (e) {
      console.error("Login fehlgeschlagen:", e);
      setMsg({ text: "Fehler. Bitte nochmal versuchen.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    try {
      const fd = new FormData();
      fd.append("actionType", "guestLogin");
      const res = await handleAction(fd);
      if (res?.success) window.location.href = next;
    } catch (e) {
      console.error("Gast-Login fehlgeschlagen:", e);
    }
  }

  return (
    <main
      className="relative flex min-h-[100dvh] items-center justify-center p-4"
      style={{
        backgroundImage: 'url("/background.webp")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >

      <div className="relative z-10 w-full max-w-[320px] sm:max-w-sm border border-white/20 p-5 sm:p-8 bg-black/75 backdrop-blur-md">
        <a href="/shop">
          <h1 className="text-3xl sm:text-4xl font-black mb-8 tracking-tighter text-center uppercase border-b border-white/30 pb-4 text-white hover:opacity-80 transition">
            BELLATOR.
          </h1>
        </a>

        <form action={handleSubmit} className="space-y-4">
          <input name="email" type="email" required placeholder="E-MAIL"
            className="w-full bg-white/10 border-b border-white/30 p-2 focus:border-white outline-none transition uppercase text-center placeholder:text-white/40 text-white text-sm tracking-widest" />
          <div className="pw-wrap">
            <input name="password" type={showPw ? "text" : "password"} required placeholder="PASSWORT"
              className="w-full bg-white/10 border-b border-white/30 p-2 focus:border-white outline-none transition text-center placeholder:text-white/40 text-white text-sm tracking-widest" />
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white" onClick={() => setShowPw(s => !s)} tabIndex={-1}>
              {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full border-2 border-white py-3 font-black text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all disabled:opacity-50">
            {loading ? "..." : "Einloggen"}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/20 pt-4">
          <a href={`/auth${nextQuery}`}
            className="flex-1 min-w-[45%] border border-white/30 py-2 text-center text-[10px] text-white/70 uppercase tracking-widest font-bold hover:bg-white hover:text-black hover:border-white transition-all">
            ← Andere Methode
          </a>
          <a href={`/registrieren${nextQuery}`}
            className="flex-1 min-w-[45%] border border-white/30 py-2 text-center text-[10px] text-white/70 uppercase tracking-widest font-bold hover:bg-white hover:text-black hover:border-white transition-all">
            Registrieren
          </a>
          <button onClick={handleGuest}
            className="w-full border border-white/30 py-2 text-center text-[10px] text-white/70 uppercase tracking-widest font-bold hover:bg-white hover:text-black hover:border-white transition-all">
            Als Gast fortfahren →
          </button>
        </div>

        {msg && (
          <p className={`mt-4 text-[10px] text-center uppercase tracking-widest ${msg.type === "error" ? "text-red-400" : "text-green-400"}`}>
            {msg.text}
          </p>
        )}
      </div>

      <a href="/impressum" className="fixed bottom-4 right-4 text-[10px] text-white/40 uppercase tracking-widest hover:text-white transition z-20">
        Impressum
      </a>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
