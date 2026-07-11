"use client";
import { useState, useEffect } from "react";
import RedeemCodeButton from "./RedeemCodeButton";

type CountdownData = { enabled: boolean; targetDate: string; label: string };

export default function CountdownBanner({ initialConfig, variant = "row" }: { initialConfig: CountdownData; variant?: "row" | "stacked" }) {
  const [config, setConfig] = useState<CountdownData>(initialConfig);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  // Erlaubt dem Admin-Panel (gleicher Tab/Browser), eine Live-Vorschau zu
  // senden ohne neu laden zu müssen. Der eigentliche, für ALLE Besucher
  // gültige Wert kommt aber als initialConfig vom Server (siteSettings),
  // nicht mehr aus localStorage.
  useEffect(() => {
    function onPreview(e: Event) {
      const detail = (e as CustomEvent<CountdownData>).detail;
      if (detail) setConfig(detail);
    }
    window.addEventListener("bellator-countdown-preview", onPreview);
    return () => window.removeEventListener("bellator-countdown-preview", onPreview);
  }, []);

  useEffect(() => {
    if (!config?.enabled) return;
    function calc() {
      const diff = new Date(config.targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    }
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [config]);

  if (!config?.enabled) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (variant === "stacked") {
    return (
      <div className="w-full max-w-[260px] lg:max-w-[340px] mx-auto aspect-square bg-black/85 border border-zinc-800 p-5 lg:p-7 flex flex-col mb-8">
        <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 mb-3 lg:mb-5 text-center">{config.label}</p>
        <div className="flex-1 flex flex-col justify-center gap-2 lg:gap-4">
          {[["Tage", timeLeft.d], ["Stunden", timeLeft.h], ["Minuten", timeLeft.m], ["Sekunden", timeLeft.s]].map(([label, val]) => {
            const padded = pad(Number(val));
            return (
              <div key={label as string} className="flex items-center justify-between">
                <span className="text-[10px] lg:text-xs uppercase tracking-[0.15em] text-zinc-500">{label as string}</span>
                <span className="text-2xl lg:text-4xl font-black tabular-nums leading-none" style={{ fontFamily: "'Courier New', monospace" }}>
                  <span className="text-red-500">{padded[0]}</span>
                  <span className="text-zinc-300">{padded[1]}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[380px] mx-auto bg-black/85 border border-zinc-800 p-4 sm:p-5 text-center mb-8">
      <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 mb-3">{config.label}</p>
      <div className="flex justify-center gap-3 sm:gap-5">
        {[["TAGE", timeLeft.d], ["STD", timeLeft.h], ["MIN", timeLeft.m], ["SEK", timeLeft.s]].map(([label, val]) => {
          const padded = pad(Number(val));
          return (
            <div key={label as string} className="flex flex-col items-center">
              <span className="text-3xl sm:text-5xl font-black tabular-nums leading-none" style={{ fontFamily: "'Courier New', monospace" }}>
                <span className="text-red-500">{padded[0]}</span>
                <span className="text-zinc-300">{padded[1]}</span>
              </span>
              <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 mt-1">{label as string}</span>
            </div>
          );
        })}
      </div>
      {/* Mobile: Rabattcode-Button direkt unter dem Countdown (Desktop hat ihn im Header oben links) */}
      <div className="md:hidden mt-4">
        <RedeemCodeButton variant="block" />
      </div>
    </div>
  );
}
