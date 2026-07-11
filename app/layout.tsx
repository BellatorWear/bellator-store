import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import CookieBanner from "./shop/components/CookieBanner";
import GlobalSoundEffects from "./components/GlobalSoundEffects";
import ThemeScript from "./ThemeScript";
import { getCurrentUser } from "./actions";
import ProfileSetupGuard from "./ProfileSetupGuard";
import CustomValidationMessages from "./CustomValidationMessages";

export const metadata: Metadata = {
  title: "Bellator Streetwear",
  description: "240g Heavy Cotton. Oversized Fit. Ohne Kompromisse.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <ThemeScript />
        <CustomValidationMessages />
        <Providers>{children}</Providers>
        <CookieBanner />
        <GlobalSoundEffects />
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
