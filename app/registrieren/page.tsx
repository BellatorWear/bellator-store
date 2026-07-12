"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { handleAction } from "../actions";

function RegistrierenForm() {
  const [msg, setMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMsg(null);
    formData.append("actionType", "request");
    const res = await handleAction(formData);
    setLoading(false);
    if (res?.error) setMsg({ text: res.error, type: "error" });
    else if (res?.success)
      setMsg({ text: res.success as string, type: "success" });
  }

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center p-4 text-white">
      <div className="relative z-10 w-full max-w-[320px] sm:max-w-sm border border-zinc-700 p-6 sm:p-8 bg-black/60 backdrop-blur-md">
        <a href="/login">
          <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tighter text-center uppercase border-b border-zinc-500 pb-4 hover:opacity-80 transition">
            Bellator
          </h1>
        </a>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest text-center mb-6">
          Registrieren
        </p>
        <form action={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            required
            className="w-full bg-black/80 border-b border-zinc-600 p-2 focus:border-white outline-none transition uppercase text-center placeholder:text-zinc-600 text-white"
            placeholder="E-MAIL ADRESSE"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-zinc-500 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50"
          >
            {loading ? "..." : "Zugang anfordern"}
          </button>
        </form>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href={`/login${nextQuery}`}
            className="flex-1 min-w-[45%] border border-zinc-600 py-2 text-center text-[10px] text-zinc-400 uppercase tracking-widest font-bold hover:bg-white hover:text-black hover:border-white transition-all">
            ← Zurück zum Login
          </a>
          <a href={`/auth${nextQuery}`}
            className="flex-1 min-w-[45%] border border-zinc-600 py-2 text-center text-[10px] text-zinc-400 uppercase tracking-widest font-bold hover:bg-white hover:text-black hover:border-white transition-all">
            Andere Methode
          </a>
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
  );
}

export default function RegistrierenPage() {
  return (
    <Suspense fallback={null}>
      <RegistrierenForm />
    </Suspense>
  );
}
