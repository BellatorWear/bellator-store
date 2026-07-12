"use client";

import { useState, useEffect } from "react";

const CONSENT_COOKIE = "bellator-cookie-consent";

function getCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

function setConsentCookie() {
  document.cookie = `${CONSENT_COOKIE}=seen; max-age=${60 * 60 * 24 * 365}; path=/; samesite=strict`;
}

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!getCookie(CONSENT_COOKIE)) setIsVisible(true);
  }, []);

  function accept() {
    setConsentCookie();
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[9999] t-card border p-5 sm:p-6 t-invert"
      style={{ boxShadow: "10px 10px 0px 0px var(--shadow)" }}>
      <p className="text-xs t-text leading-relaxed mb-3">
        Wir verwenden ausschließlich technisch notwendige Cookies: Login,
        Warenkorb, Gast-Sitzung, Theme-Einstellung und diese
        Cookie-Meldung selbst. Für die Bezahlung nutzen wir Stripe, das
        eigene Cookies zur Betrugsprävention setzen kann. Aktuell setzen
        wir keine Tracking- oder Analyse-Cookies ein.
      </p>
      <p className="text-xs t-text leading-relaxed mb-4">
        Mehr dazu in unserer{" "}
        <a href="/datenschutz" className="underline hover:t-text t-muted">Datenschutzerklärung</a>.
      </p>
      <button onClick={accept}
        className="border t-border px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition t-text">
        Verstanden
      </button>
    </div>
  );
}
