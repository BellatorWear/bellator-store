import { ImageResponse } from "next/og";

// Next.js App-Router-Convention: wird automatisch als og:image für jede
// Seite verwendet, die kein eigenes opengraph-image bereitstellt (Produkt-
// seiten könnten später ein eigenes pro Produkt bekommen, siehe Kommentar
// in app/shop/produkt/[slug]/page.tsx). Wird zur Build-Zeit statisch
// gerendert (keine Laufzeitkosten pro Request), da hier keine dynamischen
// Daten einfließen.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "#ffffff",
          fontFamily: "monospace",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 12, color: "#71717a", marginBottom: 24, textTransform: "uppercase" }}>
          Bellator Streetwear
        </div>
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -4, textTransform: "uppercase", lineHeight: 1, textAlign: "center" }}>
          240g. Oversized.
        </div>
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -4, textTransform: "uppercase", lineHeight: 1 }}>
          Limited.
        </div>
      </div>
    ),
    { ...size },
  );
}
