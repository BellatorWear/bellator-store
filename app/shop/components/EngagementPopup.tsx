"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import NotificationToggle from "@/app/einstellungen/NotificationToggle";
import NewsletterToggle from "@/app/einstellungen/NewsletterToggle";

const DISMISS_COOKIE = "bellator-engagement-dismissed";

function getCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

export default function EngagementPopup({
  initialNewsletterOptIn,
  initialPushEnabled,
}: {
  initialNewsletterOptIn: boolean;
  initialPushEnabled: boolean;
}) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Beide schon aktiv? Dann gibt's nichts zu fragen.
    if (initialNewsletterOptIn && initialPushEnabled) return;
    if (getCookie(DISMISS_COOKIE)) return;

    const timer = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(timer);
  }, [initialNewsletterOptIn, initialPushEnabled]);

  function dismiss() {
    // Nicht sicherheitsrelevant — reines UI-Cookie, daher direkt im Client gesetzt.
    document.cookie = `${DISMISS_COOKIE}=1; max-age=${60 * 60 * 24 * 14}; path=/; samesite=strict`;
    setShow(false);
  }

  if (!show || !mounted) return null;

  // Per createPortal direkt in document.body - rendert sonst verschachtelt
  // im Layout und könnte mit anderen fixed-Overlays (z.B. dem
  // Rabattcode-Modal) in einen Stacking-Context-Konflikt geraten.
  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 t-invert">
      <div className="w-full max-w-sm t-card border p-6 sm:p-8">
        <h2 className="text-xl font-black uppercase tracking-tighter mb-2 t-text">Bleib auf dem Laufenden</h2>
        <p className="text-xs t-muted uppercase tracking-widest mb-6 leading-relaxed">
          Verpasse keinen Drop, keine Aktion und keine Challenge.
        </p>

        <div className="space-y-4">
          {!initialNewsletterOptIn && (
            <div className="flex justify-between items-center py-2 border-b t-border-s">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">Newsletter</p>
                <p className="text-[10px] t-muted mt-0.5">Drops & Aktionen per Email.</p>
              </div>
              <NewsletterToggle initialEnabled={initialNewsletterOptIn} />
            </div>
          )}
          {!initialPushEnabled && (
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">Push</p>
                <p className="text-[10px] t-muted mt-0.5">Direkt im Browser benachrichtigt werden.</p>
              </div>
              <NotificationToggle initialEnabled={initialPushEnabled} />
            </div>
          )}
        </div>

        <button onClick={dismiss}
          className="mt-6 w-full t-btn-outline py-3 font-black text-xs uppercase tracking-widest transition-all">
          Fertig
        </button>
      </div>
    </div>,
    document.body,
  );
}
