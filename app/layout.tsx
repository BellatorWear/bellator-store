import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import CookieBanner from "./shop/components/CookieBanner";
import GlobalSoundEffects from "./components/GlobalSoundEffects";
import ThemeScript from "./ThemeScript";
import { getCurrentUser } from "./actions";
import ProfileSetupGuard from "./ProfileSetupGuard";
import CustomValidationMessages from "./CustomValidationMessages";
import { isFeatureEnabled } from "./utils/featureFlags";
import OfflineSync from "./components/OfflineSync";

const SITE_URL = "https://mz-dev.de";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // Vorlage für alle Unterseiten, die selbst einen title in ihrer
    // metadata setzen (z.B. "Shop — Bellator Streetwear"). Seiten ohne
    // eigenen title fallen auf "default" zurück - dadurch hat jede Seite
    // automatisch einen eindeutigen <title>, ohne dass man ihn überall
    // manuell zusammenbauen muss.
    default: "Bellator Streetwear",
    template: "%s — Bellator Streetwear",
  },
  description: "240g Heavy Cotton. Oversized Fit. Streng limitiert. Streetwear ohne Kompromisse.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: "Bellator Streetwear",
    locale: "de_DE",
    url: SITE_URL,
    title: "Bellator Streetwear",
    description: "240g Heavy Cotton. Oversized Fit. Streng limitiert.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bellator Streetwear",
    description: "240g Heavy Cotton. Oversized Fit. Streng limitiert.",
  },
  // Sorgt dafür, dass die als Homescreen-App gestartete Seite auf iOS
  // wirklich standalone aussieht (kein Safari-Chrome), statt nur wie ein
  // Lesezeichen. Auf Android übernimmt manifest.json ("display":
  // "standalone") denselben Zweck.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bellator",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

// Organization-Schema (schema.org JSON-LD), sitweit im <head>. Bewusst
// KEIN LocalBusiness-Schema: das würde eine echte Postadresse voraussetzen
// (address/PostalAddress), im Impressum steht aktuell aber noch
// "[Straße und Hausnummer]" als Platzhalter. Erfundene Adressdaten in
// strukturierten Daten wären falsche Angaben gegenüber Google/Nutzern -
// sobald eine echte Geschäftsadresse im Impressum steht, kann das hier
// zu LocalBusiness erweitert werden (siehe Kommentar unten im Code).
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Bellator Streetwear",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`,
  sameAs: ["https://discord.gg/T4RwVJRyRp"],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, soundEffectsEnabled] = await Promise.all([
    getCurrentUser(),
    isFeatureEnabled("soundEffects"),
  ]);

  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <ThemeScript />
        <OfflineSync />
        <CustomValidationMessages />
        <Providers>{children}</Providers>
        <CookieBanner />
        {soundEffectsEnabled && <GlobalSoundEffects />}
        {user && (
          <ProfileSetupGuard
            mustSetPassword={user.mustSetPassword}
            hasUsername={!!user.username}
            email={user.email}
          />
        )}
      </body>
    </html>
  );
}
