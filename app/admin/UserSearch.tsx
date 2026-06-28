"use client";
import { useState } from "react";
import { searchUserByUsername } from "./actions";

type UserResult = {
  id: number;
  memberNo: number;
  email: string;
  username: string | null;
  isAdmin: boolean | null;
  points: number | null;
  orderCount: number | null;
  discountPercent: number | null;
  emailVerified: boolean | null;
  createdAt: string | Date | null;
  mustSetPassword: boolean | null;
};
type HistoryEntry = { username: string; changedAt: string | Date | null };

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ user: UserResult; history: HistoryEntry[] } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setErr("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("username", query.trim());
      const res = await searchUserByUsername(fd);
      if (res?.error) {
        setErr(res.error);
        return;
      }
      if (res?.success) setResult({ user: res.user, history: res.history });
    } catch (e) {
      console.error("User-Suche fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  function fmtDate(d: string | Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  return (
    <section className="border border-zinc-700 p-4 sm:p-6 space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">User-Suche (Username)</h2>
      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Findet einen User über seinen aktuellen ODER einen früheren Benutzernamen.
      </p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Benutzername (aktuell oder alt)"
          className="flex-1 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600"
        />
        <button type="submit" disabled={loading}
          className="border border-zinc-500 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50">
          {loading ? "..." : "Suchen"}
        </button>
      </form>

      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}

      {result && (
        <div className="border border-zinc-800 p-4 space-y-3">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <p className="text-sm font-bold text-white">
                {result.user.username ?? <span className="text-zinc-500 italic">kein Username</span>}
                {result.user.isAdmin && <span className="ml-2 text-purple-400 text-[10px] uppercase">Admin</span>}
              </p>
              <p className="text-xs text-zinc-500">{result.user.email}</p>
            </div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest border border-zinc-700 px-2 py-1">
              Member #{result.user.memberNo}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
            <p>Punkte: <span className="text-yellow-400 font-bold">{result.user.points ?? 0}</span></p>
            <p>Bestellungen: <span className="text-white font-bold">{result.user.orderCount ?? 0}</span></p>
            <p>Treuerabatt: <span className="text-white font-bold">{result.user.discountPercent ?? 0}%</span></p>
            <p>Email verifiziert: {result.user.emailVerified ? "✓" : "✕"}</p>
            <p>Passwort gesetzt: {result.user.mustSetPassword ? "✕ (ausstehend)" : "✓"}</p>
            <p>Beigetreten: {fmtDate(result.user.createdAt)}</p>
          </div>

          <div className="pt-2 border-t border-zinc-800">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Username-Historie</p>
            {result.history.length === 0 ? (
              <p className="text-xs text-zinc-600">Keine Historie vorhanden.</p>
            ) : (
              <div className="space-y-1">
                {result.history.map((h, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className={i === 0 ? "text-white font-bold" : "text-zinc-500"}>
                      {h.username} {i === 0 && <span className="text-[9px] text-green-500">(aktuell)</span>}
                    </span>
                    <span className="text-zinc-600">{fmtDate(h.changedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
