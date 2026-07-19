"use client";
import { useState } from "react";
import { saveChatRoleAccess, setUserChatAccess, setUserTeamMembership, searchUserByUsername } from "./actions";
import type { ChatRoleAccess } from "./permissions";
import type { RoleConfig } from "./roles";

type UserResult = { id: number; email: string; username: string | null; role: string | null; chatAccess: boolean | null; isTeam: boolean | null };

export default function TeamChatAccess({ initialRoleAccess, roles }: { initialRoleAccess: ChatRoleAccess; roles: RoleConfig[] }) {
  const [roleAccess, setRoleAccess] = useState(initialRoleAccess);
  const [savingRole, setSavingRole] = useState(false);
  const [roleSaved, setRoleSaved] = useState(false);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [user, setUser] = useState<UserResult | null>(null);

  async function toggleRole(roleName: string) {
    const next = { ...roleAccess, [roleName]: !roleAccess[roleName] };
    setRoleAccess(next);
    setSavingRole(true);
    try {
      const fd = new FormData();
      fd.append("roles", JSON.stringify(next));
      await saveChatRoleAccess(fd);
      setRoleSaved(true);
      setTimeout(() => setRoleSaved(false), 1500);
    } finally {
      setSavingRole(false);
    }
  }

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
      if (res?.success) setUser({ id: res.user.id, email: res.user.email, username: res.user.username, role: res.user.role ?? null, chatAccess: res.user.chatAccess ?? null, isTeam: res.user.isTeam ?? false });
    } catch (e) {
      console.error("User-Suche fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  async function changeAccess(value: "true" | "false" | "inherit") {
    if (!user || saving) return;
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("userId", String(user.id));
      fd.append("value", value);
      const res = await setUserChatAccess(fd);
      if (res?.error) { setErr(res.error); return; }
      setUser({ ...user, chatAccess: value === "true" ? true : value === "false" ? false : null });
      setMsg("✓ Zugriff aktualisiert.");
    } catch (e) {
      console.error("Chat-Zugriff setzen fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTeamMembership() {
    if (!user || saving) return;
    const next = !user.isTeam;
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("userId", String(user.id));
      fd.append("isTeam", String(next));
      const res = await setUserTeamMembership(fd);
      if (res?.error) { setErr(res.error); return; }
      setUser({ ...user, isTeam: next });
      setMsg(next ? "✓ Zum Team-Channel hinzugefügt." : "✓ Aus dem Team-Channel entfernt.");
    } catch (e) {
      console.error("Team-Mitgliedschaft setzen fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  function roleLabel(name: string | null): string {
    return roles.find((r) => r.name === name)?.label ?? name ?? "";
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[9px] text-zinc-600 leading-relaxed mb-3">
          Rollen-Standard: Wer diese Rolle hat, bekommt automatisch Team-Chat-Zugriff, außer bei einem User weiter unten
          explizit anders eingestellt. Volle Admins haben immer Zugriff.
        </p>
        {roles.length === 0 ? (
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Noch keine Rollen erstellt (siehe &quot;Rollen vergeben&quot;).</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                key={r.name}
                type="button"
                onClick={() => toggleRole(r.name)}
                disabled={savingRole}
                className={`border p-3 text-left transition-all disabled:opacity-50 ${
                  roleAccess[r.name] ? "border-green-700 bg-green-900/10" : "border-zinc-800"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: r.color }}>{r.label}</p>
                <p className={`text-[9px] mt-1 uppercase tracking-widest ${roleAccess[r.name] ? "text-green-400" : "text-zinc-600"}`}>
                  {roleAccess[r.name] ? "Zugriff aktiv" : "Kein Zugriff"}
                </p>
              </button>
            ))}
          </div>
        )}
        {roleSaved && <p className="text-[9px] text-green-500 uppercase tracking-widest mt-2">✓ Gespeichert</p>}
      </div>

      <div className="border-t border-zinc-800 pt-4">
        <p className="text-[9px] text-zinc-600 leading-relaxed mb-3">
          Einzelnen User suchen, um den Rollen-Standard für genau diesen Account zu übersteuern (z.B. einem Marketing-User
          Zugriff geben, ohne die ganze Rolle umzustellen).
        </p>
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

        {err && <p className="text-[10px] text-red-500 uppercase tracking-widest mt-2">{err}</p>}
        {msg && <p className="text-[10px] text-green-500 uppercase tracking-widest mt-2">{msg}</p>}

        {user && (
          <div className="border border-zinc-800 p-4 space-y-3 mt-3">
            <div>
              <p className="text-sm font-bold text-white">{user.username ?? <span className="text-zinc-500 italic">kein Username</span>}</p>
              <p className="text-xs text-zinc-500">{user.email} {user.role && <span className="text-zinc-600">— {roleLabel(user.role)}</span>}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => changeAccess("inherit")} disabled={saving}
                className={`text-[10px] border px-3 py-1.5 uppercase tracking-widest transition disabled:opacity-50 ${
                  user.chatAccess === null ? "border-white bg-white text-black" : "border-zinc-700 text-zinc-400 hover:border-zinc-400"
                }`}>
                Rollen-Standard erben
              </button>
              <button type="button" onClick={() => changeAccess("true")} disabled={saving}
                className={`text-[10px] border px-3 py-1.5 uppercase tracking-widest transition disabled:opacity-50 ${
                  user.chatAccess === true ? "border-green-500 bg-green-900/30 text-green-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-400"
                }`}>
                Immer Zugriff
              </button>
              <button type="button" onClick={() => changeAccess("false")} disabled={saving}
                className={`text-[10px] border px-3 py-1.5 uppercase tracking-widest transition disabled:opacity-50 ${
                  user.chatAccess === false ? "border-red-500 bg-red-900/30 text-red-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-400"
                }`}>
                Nie Zugriff
              </button>
            </div>

            <div className="border-t border-zinc-800 pt-3 mt-1">
              <p className="text-[9px] text-zinc-600 leading-relaxed mb-2">
                Team-Attribut: Mitglied wird automatisch zum globalen &quot;Team&quot;-Channel hinzugefügt/entfernt.
              </p>
              <button type="button" onClick={toggleTeamMembership} disabled={saving}
                className={`text-[10px] border px-3 py-1.5 uppercase tracking-widest transition disabled:opacity-50 ${
                  user.isTeam ? "border-blue-500 bg-blue-900/30 text-blue-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-400"
                }`}>
                {user.isTeam ? "✓ Team-Mitglied" : "Kein Team-Mitglied"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
