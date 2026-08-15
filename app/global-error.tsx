"use client";

// Next.js App-Router-Convention: greift nur, wenn der Fehler im Root-Layout
// selbst passiert (app/error.tsx kann das nicht abfangen, weil es Teil des
// Layouts ist). Muss deshalb sein eigenes <html>/<body> mitbringen - das
// normale Layout ist zu diesem Zeitpunkt nicht mehr verfügbar. Bewusst
// minimal gehalten (kein Tailwind/Fonts-Import), damit diese Seite auch
// dann noch funktioniert, wenn genau das schiefgegangen ist.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body style={{
        margin: 0,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        color: "#fff",
        fontFamily: "monospace",
        textAlign: "center",
        padding: "1rem",
      }}>
        <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#71717a", marginBottom: 16 }}>
          Bellator Streetwear
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, textTransform: "uppercase", marginBottom: 16 }}>
          Server kurz überlastet
        </h1>
        <p style={{ fontSize: 14, color: "#a1a1aa", maxWidth: 420, marginBottom: 24, lineHeight: 1.6 }}>
          Etwas ist grundlegend schiefgelaufen. Bitte lade die Seite in ein
          paar Sekunden neu.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#fff",
            color: "#000",
            border: "3px solid #fff",
            padding: "12px 24px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          Nochmal versuchen
        </button>
      </body>
    </html>
  );
}
