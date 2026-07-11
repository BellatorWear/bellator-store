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

// Hover-Sound: weicher, kurzer Tick (gefiltert statt roher Rechteckwelle,
// klingt dadurch runder statt scharf/blechern)
export function playHoverSound() {
  const ctx = createAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2200, ctx.currentTime);
  osc.frequency.setValueAtTime(1100, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.04);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.07);
}

// Click-Sound: satter, weicher "Pop" statt scharfer Sägezahnwelle -
// zwei leicht versetzte Oszillatoren für mehr Körper, gefiltert für einen
// runden statt blechernen Klang (angelehnt an dezente Browser-UI-Sounds).
export function playClickSound() {
  const ctx = createAudioContext();
  if (!ctx) return;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, ctx.currentTime);
  filter.connect(ctx.destination);

  [{ freq: 320, delay: 0, gain: 0.11 }, { freq: 480, delay: 0.005, gain: 0.05 }].forEach(({ freq, delay, gain: g }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(filter);
    osc.type = "triangle";
    const t = ctx.currentTime + delay;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + 0.1);
    gain.gain.setValueAtTime(g, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t);
    osc.stop(t + 0.1);
  });
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
