"use client";
import { useState } from "react";
import { searchUserByUsername, setUserRole } from "./actions";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "./permissions";

type UserResult = { id: number; email: string; username: string | null; role: string | null };

const ROLES = ["admin", "developer", "marketing"] as const;

export default function RoleManager() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [user, setUser] = useState<UserResult | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setErr("");
    setMsg("");
    setUser(null);
    try {
      const fd = new FormData();
      fd.append("username", query.trim());
      const res = await searchUserByUsername(fd);
      if (res?.error) { setErr(res.error); return; }
      if (res?.success) setUser({ id: res.user.id, email: res.user.email, username: res.user.username, role: res.user.role ?? null });
    } catch (e) {
      console.error("User-Suche fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(role: string | null) {
    if (!user || saving) return;
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("userId", String(user.id));
      fd.append("role", role ?? "");
      const res = await setUserRole(fd);
      if (res?.error) { setErr(res.error); return; }
      setUser({ ...user, role });
      setMsg("✓ Rolle aktualisiert.");
    } catch (e) {
      console.error("Rolle setzen fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Rollen schalten feste Bereiche im Adminpanel frei. Nur volle Admins können Rollen vergeben.
      </p>

      <div className="grid sm:grid-cols-3 gap-2">
        {ROLES.map((r) => (
          <div key={r} className="border border-zinc-800 p-2">
            <p className="text-[10px] font-bold text-white uppercase tracking-widest">{ROLE_LABELS[r]}</p>
            <p className="text-[9px] text-zinc-500 mt-1 leading-relaxed">{ROLE_DESCRIPTIONS[r]}</p>
          </div>
        ))}
      </div>

      <form onSubmit={search} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Email oder Benutzername"
          className="flex-1 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600"
        />
        <button type="submit" disabled={loading}
          className="border border-zinc-500 px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50">
          {loading ? "..." : "Suchen"}
        </button>
      </form>

      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}
      {msg && <p className="text-[10px] text-green-500 uppercase tracking-widest">{msg}</p>}

      {user && (
        <div className="border border-zinc-800 p-4 space-y-3">
          <div>
            <p className="text-sm font-bold text-white">{user.username ?? <span className="text-zinc-500 italic">kein Username</span>}</p>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => changeRole(null)} disabled={saving}
              className={`text-[10px] border px-3 py-1.5 uppercase tracking-widest transition disabled:opacity-50 ${
                !user.role ? "border-white bg-white text-black" : "border-zinc-700 text-zinc-400 hover:border-zinc-400"
              }`}>
              Kein Team-Zugriff
            </button>
            {ROLES.map((r) => (
              <button key={r} type="button" onClick={() => changeRole(r)} disabled={saving}
                className={`text-[10px] border px-3 py-1.5 uppercase tracking-widest transition disabled:opacity-50 ${
                  user.role === r ? "border-white bg-white text-black" : "border-zinc-700 text-zinc-400 hover:border-zinc-400"
                }`}>
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
