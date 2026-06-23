import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Bellator Streetwear",
  description: "240g Heavy Cotton. Oversized Fit. Ohne Kompromisse.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            try {
              var m = document.cookie.match(/bellator-theme=([^;]+)/);
              if (m) document.documentElement.setAttribute('data-theme', m[1]);
            } catch(e) {}
          })();
        `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
