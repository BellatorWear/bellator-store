"use client";

import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        theme?: "light" | "dark" | "auto";
      }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile-Skript konnte nicht geladen werden."));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

/**
 * Rendert das Cloudflare-Turnstile-Widget und liefert das Verifizierungs-
 * Token per onVerify-Callback. Der Aufrufer hängt das Token als Hidden-
 * Field oder direkt vor dem Server-Action-Call ans FormData an (siehe
 * app/login/page.tsx für ein Beispiel).
 *
 * Rendert NICHTS, wenn NEXT_PUBLIC_TURNSTILE_SITE_KEY nicht gesetzt ist -
 * das Formular bleibt dann ganz normal nutzbar (server-seitig fail-open,
 * siehe app/utils/turnstile.ts), nur eben (noch) ohne Bot-Schutz.
 */
export default function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const containerId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          theme: "dark",
        });
      })
      .catch((err) => console.error("Turnstile:", err));

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} id={`turnstile-${containerId}`} className="my-3" />;
}
