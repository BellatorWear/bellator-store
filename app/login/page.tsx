"use client";
import { useState } from "react";
import { handleAction } from "../actions";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import SetUsernameModal from "../SetUsernameModal";

function PasswordInput({ name, placeholder }: { name: string; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-wrap">
      <input
        name={name}
        type={show ? "text" : "password"}
        required
        placeholder={placeholder}
        className="w-full t-input border-b p-2 text-center uppercase tracking-widest text-sm"
      />
      <button type="button" className="pw-eye" onClick={() => setShow(s => !s)} tabIndex={-1}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function PasswordModal({ email, onDone }: { email: string; onDone: () => void }) {
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) { setErr("Mindestens 8 Zeichen."); return; }
    if (pw !== pw2) { setErr("Passwörter stimmen nicht überein."); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append("actionType", "setPassword");
    fd.append("password", pw);
    const res = await handleAction(fd);
    setLoading(false);
    if (res.error) { setErr(res.error); return; }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm t-card border p-8">
        <h2 className="text-xl font-black uppercase tracking-tighter mb-2 t-text">Passwort setzen</h2>
        <p className="text-xs t-muted uppercase tracking-widest mb-6">Lege jetzt dein Passwort fest{email ? ` für ${email}` : ""}.</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="pw-wrap">
            <input type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)}
              placeholder="NEUES PASSWORT" required className="w-full t-input border-b p-2 text-center uppercase tracking-widest text-sm" />
            <button type="button" className="pw-eye" onClick={() => setShowPw(s => !s)} tabIndex={-1}>
              {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          <div className="pw-wrap">
            <input type={showPw2 ? "text" : "password"} value={pw2} onChange={e => setPw2(e.target.value)}
              placeholder="PASSWORT BESTÄTIGEN" required className="w-full t-input border-b p-2 text-center uppercase tracking-widest text-sm" />
            <button type="button" className="pw-eye" onClick={() => setShowPw2(s => !s)} tabIndex={-1}>
              {showPw2 ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          {err && <p className="text-red-500 text-[10px] uppercase tracking-widest text-center">{err}</p>}
          <button type="submit" disabled={loading}
            className="w-full t-btn-primary py-3 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50">
            {loading ? "..." : "Passwort speichern"}
          </button>
        </form>
        <p className="mt-3 text-[10px] t-faint uppercase tracking-widest text-center">Mindestens 8 Zeichen</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMsg(null);
    formData.append("actionType", "login");
    const res = await handleAction(formData);
    setLoading(false);
    if (res?.error) { setMsg({ text: res.error, type: "error" }); return; }
    if (res?.success === true) {
      if (res.mustSetPassword) { setCurrentEmail(res.email || ""); setShowPasswordModal(true); }
      else router.push("/shop");
    }
  }

  async function handleGuest() {
    const fd = new FormData();
    fd.append("actionType", "guestLogin");
    const res = await handleAction(fd);
    if (res?.success) window.location.href = "/shop";
  }

  return (
    <>
      <main
        className="relative flex min-h-[100dvh] items-center justify-center p-4"
        style={{
          backgroundImage: 'url("/background.webp")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Overlay für Kontrast */}
        <div className="absolute inset-0 bg-black/60 z-0" />

        <div className="relative z-10 w-full max-w-[320px] sm:max-w-sm border border-white/20 p-5 sm:p-8 bg-black/75 backdrop-blur-md">
          <a href="/shop">
            <h1 className="text-3xl sm:text-4xl font-black mb-8 tracking-tighter text-center uppercase border-b border-white/30 pb-4 text-white hover:opacity-80 transition">
              BELLATOR.
            </h1>
          </a>

          <form action={handleSubmit} className="space-y-4">
            <input name="email" type="email" required placeholder="E-MAIL"
              className="w-full bg-white/10 border-b border-white/30 p-2 focus:border-white outline-none transition uppercase text-center placeholder:text-white/40 text-white text-sm tracking-widest" />
            <div className="pw-wrap">
              <input name="password" type={showPw ? "text" : "password"} required placeholder="PASSWORT"
                className="w-full bg-white/10 border-b border-white/30 p-2 focus:border-white outline-none transition text-center placeholder:text-white/40 text-white text-sm tracking-widest" />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white" onClick={() => setShowPw(s => !s)} tabIndex={-1}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full border-2 border-white py-3 font-black text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all disabled:opacity-50">
              {loading ? "..." : "Einloggen"}
            </button>
          </form>

          <div className="mt-6 space-y-3 border-t border-white/20 pt-4">
            <a href="/" className="block w-full text-[11px] text-white/60 uppercase tracking-widest hover:text-white transition text-center">
              ← Andere Methode wählen
            </a>
            <a href="/accesskey" className="block w-full text-[11px] text-white/60 uppercase tracking-widest hover:text-white transition text-center">
              Mit Access Key einloggen
            </a>
            <a href="/registrieren" className="block w-full text-[11px] text-white/80 uppercase tracking-widest hover:text-white transition text-center">
              Noch kein Account? → Registrieren
            </a>
            <button onClick={handleGuest} className="w-full text-[11px] text-white/50 uppercase tracking-widest hover:text-white/80 transition">
              Als Gast fortfahren →
            </button>
          </div>

          {msg && (
            <p className={`mt-4 text-[10px] text-center uppercase tracking-widest ${msg.type === "error" ? "text-red-400" : "text-green-400"}`}>
              {msg.text}
            </p>
          )}
        </div>

        <a href="/impressum" className="fixed bottom-4 right-4 text-[10px] text-white/40 uppercase tracking-widest hover:text-white transition z-20">
          Impressum
        </a>
      </main>

      {showPasswordModal && (
        <PasswordModal email={currentEmail} onDone={() => { setShowPasswordModal(false); setShowUsernameModal(true); }} />
      )}
      {showUsernameModal && (
        <SetUsernameModal onDone={() => router.push("/shop")} />
      )}
    </>
  );
}
