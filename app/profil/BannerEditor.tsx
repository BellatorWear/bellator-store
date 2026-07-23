"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { saveProfileBanner, removeProfileBanner } from "./bannerActions";

const CANVAS_W = 1200;
const CANVAS_H = 300;

type Template = "solid" | "drip" | "burst" | "stripes" | "tags" | "noise";

const TEMPLATES: { id: Template; label: string }[] = [
  { id: "solid", label: "Einfarbig" },
  { id: "drip", label: "Drip" },
  { id: "burst", label: "Spray Burst" },
  { id: "stripes", label: "Streifen" },
  { id: "tags", label: "Tag Grid" },
  { id: "noise", label: "Noise" },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function drawTemplate(ctx: CanvasRenderingContext2D, template: Template, bgColor: string, w: number, h: number) {
  const rand = seededRandom(42);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  if (template === "solid") return;

  if (template === "drip") {
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    for (let i = 0; i < 22; i++) {
      const x = rand() * w;
      const dripH = 40 + rand() * h * 0.75;
      const width = 6 + rand() * 14;
      ctx.beginPath();
      ctx.moveTo(x - width / 2, 0);
      ctx.lineTo(x + width / 2, 0);
      ctx.lineTo(x + width / 4, dripH);
      ctx.quadraticCurveTo(x, dripH + width, x - width / 4, dripH);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  if (template === "burst") {
    const cx = w / 2, cy = h / 2;
    for (let i = 0; i < 6; i++) {
      const r = 40 + i * 45;
      ctx.strokeStyle = `rgba(255,255,255,${0.14 - i * 0.018})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 60; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 60 + rand() * (w * 0.5);
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist * 0.4;
      const r = 1.5 + rand() * 4;
      ctx.fillStyle = `rgba(255,255,255,${0.08 + rand() * 0.12})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (template === "stripes") {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.28);
    ctx.translate(-w / 2, -h / 2);
    for (let x = -h; x < w + h; x += 46) {
      ctx.fillStyle = "rgba(255,255,255,0.09)";
      ctx.fillRect(x, -h, 22, h * 3);
    }
    ctx.restore();
    return;
  }

  if (template === "tags") {
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 2;
    const cell = 60;
    for (let x = 0; x < w; x += cell) {
      for (let y = 0; y < h; y += cell) {
        if (rand() > 0.55) {
          ctx.beginPath();
          ctx.moveTo(x + 8, y + cell - 8);
          ctx.lineTo(x + cell / 2, y + 8);
          ctx.lineTo(x + cell - 8, y + cell - 8);
          ctx.stroke();
        }
      }
    }
    return;
  }

  if (template === "noise") {
    for (let i = 0; i < 900; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const r = rand() * 1.8;
      ctx.fillStyle = `rgba(255,255,255,${rand() * 0.25})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale, sh = h / scale;
  const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}

export default function BannerEditor({ initialBannerUrl }: { initialBannerUrl: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const [tab, setTab] = useState<"farbe" | "vorlage" | "foto">("vorlage");
  const [bgColor, setBgColor] = useState("#111111");
  const [template, setTemplate] = useState<Template>("drip");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [brushColor, setBrushColor] = useState("#ff2d55");
  const [brushSize, setBrushSize] = useState(18);
  const [eraser, setEraser] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const applyBackground = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (photoUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => drawImageCover(ctx, img, CANVAS_W, CANVAS_H);
      img.src = photoUrl;
    } else {
      drawTemplate(ctx, template, bgColor, CANVAS_W, CANVAS_H);
    }
  }, [photoUrl, template, bgColor]);

  useEffect(() => {
    applyBackground();
  }, [applyBackground]);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function sprayDab(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const dabs = 10;
    for (let i = 0; i < dabs; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * brushSize;
      const dx = x + Math.cos(angle) * dist;
      const dy = y + Math.sin(angle) * dist;
      const r = 0.6 + Math.random() * (brushSize * 0.08);
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = eraser ? "destination-out" : "source-over";
    ctx.fillStyle = brushColor;
    const pos = getPos(e);
    lastPoint.current = pos;
    sprayDab(ctx, pos.x, pos.y);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    // Zwischenpunkte interpolieren, sonst entstehen bei schnellen
    // Bewegungen Lücken zwischen den Spray-Dabs.
    const last = lastPoint.current ?? pos;
    const steps = Math.max(1, Math.floor(Math.hypot(pos.x - last.x, pos.y - last.y) / 4));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      sprayDab(ctx, last.x + (pos.x - last.x) * t, last.y + (pos.y - last.y) * t);
    }
    lastPoint.current = pos;
  }

  function handlePointerUp() {
    drawing.current = false;
    lastPoint.current = null;
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/banner-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "Upload fehlgeschlagen."); return; }
      setPhotoUrl(data.url);
      setTab("foto");
    } catch (err) {
      console.error("Foto-Upload fehlgeschlagen:", err);
      setMsg("Upload fehlgeschlagen.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas || saving) return;
    setSaving(true);
    setMsg("");
    try {
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) { setMsg("Export fehlgeschlagen."); return; }
      const fd = new FormData();
      fd.append("file", new File([blob], "banner.png", { type: "image/png" }));
      const res = await fetch("/api/profile/banner-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "Upload fehlgeschlagen."); return; }
      const saveRes = await saveProfileBanner(data.url);
      if (saveRes?.error) { setMsg(saveRes.error); return; }
      setMsg("✓ Banner gespeichert.");
    } catch (err) {
      console.error("Banner speichern fehlgeschlagen:", err);
      setMsg("Fehler. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (saving) return;
    setSaving(true);
    try {
      await removeProfileBanner();
      setMsg("✓ Banner entfernt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="border t-border overflow-hidden touch-none select-none" style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-full cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      <div className="flex gap-2 border-b t-border-s pb-2">
        {(["vorlage", "farbe", "foto"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`text-[10px] uppercase tracking-widest px-3 py-1.5 border transition ${tab === t ? "bg-white text-black border-white" : "t-border t-muted hover:t-text"}`}>
            {t === "vorlage" ? "Vorlage" : t === "farbe" ? "Farbe" : "Foto"}
          </button>
        ))}
      </div>

      {tab === "vorlage" && (
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button key={t.id} type="button"
              onClick={() => { setPhotoUrl(null); setTemplate(t.id); }}
              className={`text-[10px] uppercase tracking-widest px-3 py-2 border transition ${!photoUrl && template === t.id ? "border-white bg-white text-black" : "t-border t-muted hover:t-text"}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === "farbe" && (
        <div className="flex items-center gap-3">
          <label className="text-[10px] t-muted uppercase tracking-widest">Hintergrundfarbe</label>
          <input type="color" value={bgColor} onChange={(e) => { setPhotoUrl(null); setBgColor(e.target.value); }}
            className="w-10 h-10 bg-transparent border t-border cursor-pointer" />
        </div>
      )}

      {tab === "foto" && (
        <div className="space-y-2">
          <label className="inline-block border t-border px-4 py-2 text-[10px] uppercase tracking-widest font-bold cursor-pointer hover:bg-white hover:text-black transition-all">
            {uploadingPhoto ? "Lädt hoch..." : "Foto hochladen"}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
          </label>
          {photoUrl && <p className="text-[9px] t-muted">Foto als Hintergrund aktiv - übermalen weiter unten möglich.</p>}
        </div>
      )}

      <div className="border-t t-border-s pt-3 space-y-3">
        <p className="text-[10px] t-muted uppercase tracking-widest">Sprayen</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[9px] t-muted uppercase tracking-widest">Farbe</label>
            <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)}
              className="w-8 h-8 bg-transparent border t-border cursor-pointer" disabled={eraser} />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
            <label className="text-[9px] t-muted uppercase tracking-widest shrink-0">Größe</label>
            <input type="range" min={4} max={50} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full" />
          </div>
          <button type="button" onClick={() => setEraser((v) => !v)}
            className={`text-[10px] uppercase tracking-widest px-3 py-1.5 border transition ${eraser ? "bg-white text-black border-white" : "t-border t-muted hover:t-text"}`}>
            Radierer
          </button>
          <button type="button" onClick={applyBackground}
            className="text-[10px] uppercase tracking-widest px-3 py-1.5 border t-border t-muted hover:t-text transition">
            Übermalungen zurücksetzen
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button type="button" onClick={handleSave} disabled={saving}
          className="t-btn-primary px-5 py-2.5 text-xs uppercase tracking-widest font-black transition-all duration-200 active:scale-[0.97] disabled:opacity-50">
          {saving ? "..." : "Banner speichern"}
        </button>
        {(initialBannerUrl || photoUrl) && (
          <button type="button" onClick={handleRemove} disabled={saving}
            className="border border-red-900 text-red-500 px-4 py-2.5 text-xs uppercase tracking-widest font-bold hover:bg-red-700 hover:text-white transition-all disabled:opacity-50">
            Banner entfernen
          </button>
        )}
      </div>
      {msg && <p className="text-[10px] t-muted uppercase tracking-widest">{msg}</p>}
    </div>
  );
}
