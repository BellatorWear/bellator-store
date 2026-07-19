"use client";
import { useState } from "react";
import { searchUserByUsername, setUserRole, createOrUpdateRole, deleteRole } from "./actions";
import { ADMIN_SECTION_IDS, ADMIN_SECTION_LABELS, type AdminSectionId } from "./permissions";
import type { RoleConfig } from "./roles";

type UserResult = { id: number; email: string; username: string | null; role: string | null };

export default function RoleManager({ initialRoles }: { initialRoles: RoleConfig[] }) {
  const [roles, setRoles] = useState<RoleConfig[]>(initialRoles);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [user, setUser] = useState<UserResult | null>(null);
  const [showCreate, setShowCreate] = useState(false);

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

  async function handleDeleteRole(name: string) {
    if (!confirm(`Rolle "${name}" wirklich löschen?`)) return;
    setErr("");
    setMsg("");
    const fd = new FormData();
    fd.append("name", name);
    const res = await deleteRole(fd);
    if (res?.error) { setErr(res.error); return; }
    setRoles((prev) => prev.filter((r) => r.name !== name));
    setMsg("✓ Rolle gelöscht.");
  }


  return (
    <div className="space-y-4">
      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Rollen schalten feste Bereiche im Adminpanel frei. Nur volle Admins können Rollen vergeben oder erstellen.
      </p>

      <div className="grid sm:grid-cols-2 gap-2">
        {roles.map((r) => (
          <div key={r.name} className="border border-zinc-800 p-2" style={{ borderLeftColor: r.color, borderLeftWidth: 3 }}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: r.color }}>{r.label}</p>
              {r.name !== "admin" && (
                <button type="button" onClick={() => handleDeleteRole(r.name)} className="text-[9px] text-zinc-600 hover:text-red-500 transition uppercase tracking-widest">
                  Löschen
                </button>
              )}
            </div>
            <p className="text-[9px] text-zinc-500 mt-1 leading-relaxed">
              {r.sections.length === 0 ? "Keine Bereiche" : r.sections.map((s) => ADMIN_SECTION_LABELS[s]).join(", ")}
              {r.canEditPosts && " · darf Posts bearbeiten/löschen"}
            </p>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setShowCreate((v) => !v)}
        className="text-[10px] uppercase tracking-widest border border-zinc-600 px-3 py-2 hover:bg-white hover:text-black transition-all font-bold">
        {showCreate ? "Abbrechen" : "+ Neue Rolle erstellen"}
      </button>

      {showCreate && (
        <RoleCreateForm
          onCreated={(role) => {
            setRoles((prev) => {
              const exists = prev.some((r) => r.name === role.name);
              return exists ? prev.map((r) => (r.name === role.name ? role : r)) : [...prev, role];
            });
            setShowCreate(false);
          }}
        />
      )}

      <form onSubmit={search} className="flex gap-2 pt-2 border-t border-zinc-800">
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
            {roles.map((r) => (
              <button key={r.name} type="button" onClick={() => changeRole(r.name)} disabled={saving}
                className="text-[10px] border px-3 py-1.5 uppercase tracking-widest transition disabled:opacity-50"
                style={
                  user.role === r.name
                    ? { borderColor: r.color, backgroundColor: r.color, color: "#000" }
                    : { borderColor: "#3f3f46", color: "#a1a1aa" }
                }>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RoleCreateForm({ onCreated }: { onCreated: (role: RoleConfig) => void }) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#a855f7");
  const [canEditPosts, setCanEditPosts] = useState(false);
  const [sections, setSections] = useState<AdminSectionId[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function toggleSection(id: AdminSectionId) {
    setSections((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !label.trim() || saving) return;
    setSaving(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("label", label.trim());
      fd.append("color", color);
      fd.append("canEditPosts", String(canEditPosts));
      sections.forEach((s) => fd.append("sections", s));
      const res = await createOrUpdateRole(fd);
      if (res?.error) { setErr(res.error); return; }
      onCreated({ name: name.trim().toLowerCase(), label: label.trim(), color, sections, canEditPosts });
    } catch (e) {
      console.error("Rolle erstellen fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="border border-zinc-700 p-4 space-y-3">
      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Interner Name (a-z, 0-9, -, _)</label>
          <input value={name} onChange={(e) => setName(e.target.value.toLowerCase())}
            placeholder="z.B. support"
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600" />
        </div>
        <div>
          <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Anzeigename</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="z.B. Support"
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-[9px] text-zinc-500 uppercase tracking-widest">Farbe</label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 bg-transparent border border-zinc-700 cursor-pointer" />
      </div>

      <div>
        <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2">Adminpanel-Bereiche</p>
        <div className="grid sm:grid-cols-2 gap-1.5">
          {ADMIN_SECTION_IDS.map((id) => (
            <label key={id} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={sections.includes(id)} onChange={() => toggleSection(id)} className="accent-white" />
              {ADMIN_SECTION_LABELS[id]}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
        <input type="checkbox" checked={canEditPosts} onChange={(e) => setCanEditPosts(e.target.checked)} className="accent-white" />
        Darf bestehende Posts (Startseite/Newsletter) bearbeiten & löschen, nicht nur neu anlegen
      </label>

      <button type="submit" disabled={!name.trim() || !label.trim() || saving}
        className="w-full border border-white bg-white text-black py-2.5 text-[10px] uppercase tracking-widest font-black hover:bg-black hover:text-white transition-all disabled:opacity-40">
        {saving ? "..." : "Rolle speichern"}
      </button>
    </form>
  );
}
