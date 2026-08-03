"use client";
import { useState } from "react";
import { startTotpSetup, confirmTotpSetup, disableMfa, regenerateBackupCodes } from "@/app/mfa/actions";

type Step = "idle" | "qr" | "backup-codes" | "disable" | "regenerate-codes";

export default function MfaSettings({ mfaEnabled: initialEnabled }: { mfaEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<Step>("idle");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function handleStart() {
    setLoading(true);
    setErr("");
    try {
      const res = await startTotpSetup();
      if (res?.error) { setErr(res.error); return; }
      setQrDataUrl(res.qrDataUrl ?? "");
      setSecret(res.secret ?? "");
      setStep("qr");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("code", code);
      const res = await confirmTotpSetup(fd);
      if (res?.error) { setErr(res.error); return; }
      setBackupCodes(res.backupCodes ?? []);
      setEnabled(true);
      setStep("backup-codes");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("password", password);
      const res = await disableMfa(fd);
      if (res?.error) { setErr(res.error); return; }
      setEnabled(false);
      setPassword("");
      setStep("idle");
      setMsg("✓ 2FA deaktiviert.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      const res = await regenerateBackupCodes();
      if (res?.error) { setErr(res.error); return; }
      setBackupCodes(res.backupCodes ?? []);
      setStep("regenerate-codes");
    } finally {
      setLoading(false);
    }
  }

  if (step === "backup-codes" || step === "regenerate-codes") {
    return (
      <div className="space-y-3">
        <p className="text-xs text-green-500 uppercase tracking-widest">
          ✓ {step === "backup-codes" ? "2FA aktiviert" : "Neue Backup-Codes erzeugt"}
        </p>
        <p className="text-xs t-muted">
          Speichere diese Backup-Codes sicher ab (z.B. Passwort-Manager). Jeder Code funktioniert einmal, falls du
          keinen Zugriff mehr auf deine Authenticator-App hast. Sie werden dir nur dieses eine Mal angezeigt.
        </p>
        <div className="grid grid-cols-2 gap-2 t-input border p-3 font-mono text-sm">
          {backupCodes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => { setStep("idle"); setBackupCodes([]); }}
          className="t-btn-primary px-4 py-2 text-xs uppercase tracking-widest font-black transition-all duration-200 active:scale-[0.97]"
        >
          Ich hab sie gespeichert
        </button>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <form onSubmit={handleConfirm} className="space-y-3">
        <p className="text-xs t-muted">
          Scanne den QR-Code mit einer Authenticator-App (Google Authenticator, Authy, 1Password, ...) und gib den
          angezeigten 6-stelligen Code ein, um die Einrichtung zu bestätigen.
        </p>
        {qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR-Code für Authenticator-App" className="w-40 h-40 bg-white p-2" />
        )}
        <details className="text-xs t-muted">
          <summary className="cursor-pointer uppercase tracking-widest text-[10px]">Code manuell eingeben</summary>
          <code className="block mt-2 t-input border p-2 break-all">{secret}</code>
        </details>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          inputMode="numeric"
          placeholder="000000"
          className="w-full t-input border px-3 py-2 text-sm outline-none transition tracking-[0.3em] text-center"
        />
        {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={() => setStep("idle")} disabled={loading}
            className="flex-1 border t-border t-muted py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50">
            Abbrechen
          </button>
          <button type="submit" disabled={loading || code.length !== 6}
            className="flex-1 t-btn-primary py-2.5 text-[10px] uppercase tracking-widest font-black transition-all disabled:opacity-50">
            {loading ? "..." : "Bestätigen"}
          </button>
        </div>
      </form>
    );
  }

  if (step === "disable") {
    return (
      <form onSubmit={handleDisable} className="space-y-3">
        <p className="text-xs t-muted">Bitte dein Passwort eingeben, um 2FA zu deaktivieren.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          className="w-full t-input border px-3 py-2 text-sm outline-none transition"
        />
        {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={() => { setStep("idle"); setPassword(""); setErr(""); }} disabled={loading}
            className="flex-1 border t-border t-muted py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50">
            Abbrechen
          </button>
          <button type="submit" disabled={loading || !password}
            className="flex-1 border border-red-900 text-red-500 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 hover:text-white transition-all disabled:opacity-50">
            {loading ? "..." : "2FA deaktivieren"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs t-muted">
        {enabled
          ? "2FA ist aktiv (Authenticator-App). Bei jedem Login wird zusätzlich ein Code aus deiner App verlangt."
          : "Schützt deinen Account zusätzlich zum Passwort mit einem Code aus einer Authenticator-App."}
      </p>
      {msg && <p className="text-[10px] text-green-500 uppercase tracking-widest">{msg}</p>}
      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}
      <div className="flex flex-wrap gap-2">
        {enabled ? (
          <>
            <button type="button" onClick={handleRegenerate} disabled={loading}
              className="border t-border t-muted px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50">
              Backup-Codes neu erzeugen
            </button>
            <button type="button" onClick={() => setStep("disable")}
              className="border border-red-900 text-red-500 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 hover:text-white transition-all">
              2FA deaktivieren
            </button>
          </>
        ) : (
          <button type="button" onClick={handleStart} disabled={loading}
            className="t-btn-primary px-4 py-2 text-xs uppercase tracking-widest font-black transition-all duration-200 active:scale-[0.97] disabled:opacity-50">
            {loading ? "..." : "2FA aktivieren"}
          </button>
        )}
      </div>
    </div>
  );
}
