"use client";
import { useEffect } from "react";

// Generiert Web-Audio-API-Sounds ohne externe Dateien — kein zusätzlicher
// CDN, kein Ladezeit-Problem. Alle Sounds werden on-demand synthetisiert.
function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

// Kurzer Startup-Sweep (nur auf der Startseite)
function playStartupSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.6);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.8);
}

// Hover-Sound: kurzer, leiser Tick
export function playHoverSound() {
  const ctx = createAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
}

// Click-Sound: satterer Klick
export function playClickSound() {
  const ctx = createAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
}

// Success-Sound: kurzer aufsteigender Ton
export function playSuccessSound() {
  const ctx = createAudioContext();
  if (!ctx) return;
  [440, 550, 660].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.15);
    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + 0.15);
  });
}

// Komponente für die Startseite: spielt einmalig den Startup-Sound
export default function LandingSound() {
  useEffect(() => {
    // Sounds dürfen erst nach einer User-Interaktion abgespielt werden
    // (Browser-Policy). Wir warten auf das erste "pointerdown" im Dokument
    // und spielen den Sound dann genau einmal ab — wenn der User die Seite
    // einfach aufruft und nichts anklickt, kein Sound.
    let played = false;
    function play() {
      if (played) return;
      played = true;
      document.removeEventListener("pointerdown", play);
      const ctx = createAudioContext();
      if (ctx) playStartupSound(ctx);
    }
    document.addEventListener("pointerdown", play, { once: true });
    return () => document.removeEventListener("pointerdown", play);
  }, []);
  return null;
}
