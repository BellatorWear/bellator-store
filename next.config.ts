import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // War auf 250mb, weil Produktbilder vorher als Base64 durch Server
      // Actions liefen - das ist jetzt nicht mehr nötig, Bilder gehen direkt
      // vom Browser zu Vercel Blob (siehe app/api/admin/upload/route.ts).
      // Vercel selbst erlaubt für Server Actions/Functions sowieso nur
      // 4,5 MB pro Request - alles darüber in next.config.ts ist wirkungslos.
      bodySizeLimit: "2mb",
    },
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },

  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://*.public.blob.vercel-storage.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://buy.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://buy.stripe.com",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
