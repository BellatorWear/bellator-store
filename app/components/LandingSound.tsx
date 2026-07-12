"use client";

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

// Hover-Sound: sehr leiser, weicher Tick - warmer Sinus mit sanftem
// Attack (kein harter Einsatz) statt scharfem Hochton.
export function playHoverSound() {
  const ctx = createAudioContext();
  if (!ctx) return;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1400, ctx.currentTime);
  filter.connect(ctx.destination);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(filter);
  osc.type = "sine";
  const t = ctx.currentTime;
  osc.frequency.setValueAtTime(680, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.022, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
  osc.start(t);
  osc.stop(t + 0.06);
}

// Click-Sound: weicher, "creamy" Thock statt scharfem Klick - warmer
// Sinuston mit sanftem Attack (kein harter Einsatz), stark gefiltert für
// einen gedämpften statt plastikigen Klang. Angelehnt an den Sound einer
// gut geölten/"creamy" Tastatur statt eines mechanischen Klicks.
export function playClickSound() {
  const ctx = createAudioContext();
  if (!ctx) return;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(850, ctx.currentTime);
  filter.Q.value = 0.6;
  filter.connect(ctx.destination);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(filter);
  osc.type = "sine";
  const t = ctx.currentTime;
  osc.frequency.setValueAtTime(190, t);
  osc.frequency.exponentialRampToValueAtTime(105, t + 0.1);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.1, t + 0.01); // sanfter Attack statt Klick-Kante
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.start(t);
  osc.stop(t + 0.13);
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

// Komponente für die Startseite. Spielte früher beim ersten Klick einen
// eigenen "Startup"-Sound zusätzlich zum normalen Klicksound ab - das
// klang zusammen mit dem Klick auf z.B. "Zum Shop" seltsam/aufgesetzt.
// Jetzt bewusst ein No-Op: die Startseite nutzt denselben Hover-/Klicksound
// wie jeder andere Button auch (siehe GlobalSoundEffects).
export default function LandingSound() {
  return null;
}
