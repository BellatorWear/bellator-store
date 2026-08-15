"use client";

import { useEffect } from "react";
import Link from "next/link";

// Next.js App-Router-Convention: wird automatisch als React Error Boundary
// um jedes Route-Segment gelegt. Fängt Fehler ab, die beim Rendern
// passieren (z.B. eine kurzzeitig nicht erreichbare Neon-DB), und zeigt
// eine ruhige, deutschsprachige Fehlerseite statt eines rohen Stacktrace
// oder eines kompletten Absturzes. Wichtig: das ist KEIN Ersatz für echte
// 503-Antworten auf API-Routen (siehe app/api/*/route.ts + middleware.ts) -
// Server Components können in Next.js keinen eigenen HTTP-Status setzen,
// diese Boundary sorgt "nur" dafür, dass Nutzer eine sinnvolle Meldung
// statt eines Crashs sehen.
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Serverseitig loggt Next.js den Fehler ohnehin; hier zusätzlich
    // clientseitig für Monitoring-Tools, die an window.onerror hängen.
    console.error("[route-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-mono px-4 text-center">
      <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 mb-4">Bellator Streetwear</p>
      <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-4">
        Kurz ausgestolpert
      </h1>
      <p className="text-sm text-zinc-400 leading-relaxed mb-8 max-w-md">
        Etwas ist gerade schiefgelaufen — meistens ist ein neuer Versuch schon
        die Lösung. Falls es weiter passiert, sag uns kurz Bescheid.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button onClick={reset}
          className="inline-block bg-white border-[3px] border-white px-6 py-3 text-xs font-black uppercase tracking-widest text-black hover:bg-transparent hover:text-white transition-all duration-200">
          Nochmal versuchen
        </button>
        <Link href="/"
          className="inline-block border-[3px] border-white px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all duration-200">
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
