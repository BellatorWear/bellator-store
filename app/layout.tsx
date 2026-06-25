import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import CookieBanner from "./shop/components/CookieBanner";
import ThemeScript from "./ThemeScript";

export const metadata: Metadata = {
  title: "Bellator Streetwear",
  description: "240g Heavy Cotton. Oversized Fit. Ohne Kompromisse.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <ThemeScript />
        <Providers>{children}</Providers>
        <CookieBanner />
      </body>
    </html>
  );
}
