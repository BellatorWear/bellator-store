import type { MetadataRoute } from "next";

// Next.js generiert daraus automatisch /robots.txt. Disallow-Liste
// spiegelt die tatsächliche Seitenstruktur wider: alles Account-/
// Auth-/interne Bereiche raus, öffentliche Shop-/Content-Seiten bleiben
// crawlbar.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mz-dev.de";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/chat",
        "/chat/",
        "/tickets",
        "/tickets/",
        "/profil",
        "/einstellungen",
        "/belege",
        "/accesskey",
        "/login",
        "/registrieren",
        "/auth",
        "/verify",
        "/passwort-vergessen",
        "/passwort-zuruecksetzen",
        "/shop/warenkorb",
        "/newsletter/abmelden",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
