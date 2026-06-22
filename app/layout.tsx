import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Hier importieren wir unseren Wrapper
import { Providers } from "./providers"; 
// Import für den Cookie-Banner (Pfad anpassen, falls er woanders liegt)
import CookieBanner from "./shop/components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bellator Streetwear Store - Offizieller Shop für exklusive Streetwear",
  description: "240g Heavy Cotton. Oversized Fit. Ohne Kompromisse. Bellator ist kein Trend, sondern eine Einstellung. Hol dir den ersten Drop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Banner direkt unter Body, damit es immer als Erstes da ist */}
        <CookieBanner />
        
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}