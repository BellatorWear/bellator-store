"use client";
import { useState } from "react";

export default function ReferralLink({ username }: { username: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!username) {
    return (
      <p className="text-xs t-muted">
        Setz zuerst einen Username in den{" "}
        <a href="/einstellungen" className="underline hover:t-text transition">
          Einstellungen
        </a>
        , um deinen Freunde-werben-Link zu bekommen.
      </p>
    );
  }

  const link = `https://mz-dev.de/registrieren?ref=${encodeURIComponent(username)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Kopieren fehlgeschlagen:", e);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs t-muted">
        Teile diesen Link - sobald ein geworbener Freund seine erste Bestellung abschließt, bekommst du Punkte gutgeschrieben.
      </p>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="flex-1 min-w-0 t-input border px-3 py-2 text-xs outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="border t-border px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-200 active:scale-[0.97] shrink-0"
        >
          {copied ? "✓ Kopiert" : "Kopieren"}
        </button>
      </div>
    </div>
  );
}
