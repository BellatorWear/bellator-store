"use client";
import { useState } from "react";
import { searchUserByUsername, setUserRole, createOrUpdateRole, deleteRole, requestUserDeletion, cancelUserDeletion } from "./actions";
import { ADMIN_SECTION_IDS, ADMIN_SECTION_LABELS, type AdminSectionId } from "./permissions";
import type { RoleConfig } from "./roles";

type UserResult = { id: number; email: string; username: string | null; role: string | null; pendingDeletionAt: string | Date | null };

// Bewusst lokal statt geteilt - es gibt (noch) keine zentrale Modal-
// Komponente im Projekt, jede Stelle baut ihren eigenen Bestätigungs-
// Dialog im selben Look (schwarzer Overlay, roter Rahmen bei
// destruktiven Aktionen), siehe z.B. app/chat/ChatClient.tsx.
function ConfirmDeleteModal({
  message,
  loading,
  onConfirm,
  onCancel,
}: {
  message: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-black border-[2px] border-red-800 w-full max-w-sm p-6 font-mono" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-zinc-300 uppercase tracking-widest leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-zinc-700 text-zinc-300 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 border-[2px] border-red-700 text-red-500 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? "..." : "Löschen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function sortByRank(list: RoleConfig[]): RoleConfig[] {
  return [...list].sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name));
}

export default function RoleManager({ initialRoles }: { initialRoles: RoleConfig[] }) {
  const [roles, setRoles] = useState<RoleConfig[]>(sortByRank(initialRoles));
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [user, setUser] = useState<UserResult | null>(null);
  const [formMode, setFormMode] = useState<null | { mode: "create" } | { mode: "edit"; role: RoleConfig }>(null);
  const [deletingRole, setDeletingRole] = useState<RoleConfig | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");
  const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [userActionErr, setUserActionErr] = useState("");

  function upsertRole(role: RoleConfig) {
    setRoles((prev) => {
      const exists = prev.some((r) => r.name === role.name);
      const next = exists ? prev.map((r) => (r.name === role.name ? role : r)) : [...prev, role];
      return sortByRank(next);
    });
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
      if (res?.success) setUser({ id: res.user.id, email: res.user.email, username: res.user.username, role: res.user.role ?? null, pendingDeletionAt: res.user.pendingDeletionAt ?? null });
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

  async function confirmUserDeletion() {
    if (!user || userActionLoading) return;
    setUserActionLoading(true);
    setUserActionErr("");
    try {
      const fd = new FormData();
      fd.append("userId", String(user.id));
      const res = await requestUserDeletion(fd);
      if (res?.error) { setUserActionErr(res.error); return; }
      setUser({ ...user, pendingDeletionAt: res.deletionDate ?? new Date().toISOString() });
      setConfirmingUserDeletion(false);
      setMsg("✓ Löschanfrage gestartet - Account gesperrt, Email mit Einwandsfrist verschickt.");
    } catch (e) {
      console.error("Löschanfrage fehlgeschlagen:", e);
      setUserActionErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleCancelUserDeletion() {
    if (!user || userActionLoading) return;
    setUserActionLoading(true);
    setUserActionErr("");
    try {
      const fd = new FormData();
      fd.append("userId", String(user.id));
      const res = await cancelUserDeletion(fd);
      if (res?.error) { setUserActionErr(res.error); return; }
      setUser({ ...user, pendingDeletionAt: null });
      setMsg("✓ Löschanfrage abgebrochen, Account wieder freigeschaltet.");
    } catch (e) {
      console.error("Abbrechen fehlgeschlagen:", e);
      setUserActionErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setUserActionLoading(false);
    }
  }


  async function confirmDeleteRole() {
    if (!deletingRole || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteErr("");
    try {
      const fd = new FormData();
      fd.append("name", deletingRole.name);
      const res = await deleteRole(fd);
      if (res?.error) { setDeleteErr(res.error); return; }
      setRoles((prev) => prev.filter((r) => r.name !== deletingRole.name));
      setDeletingRole(null);
      setMsg("✓ Rolle gelöscht.");
    } catch (e) {
      console.error("Rolle löschen fehlgeschlagen:", e);
      setDeleteErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Rollen schalten feste Bereiche im Adminpanel frei. Rang bestimmt die Reihenfolge und die Hierarchie
        bei &quot;Rollen selbst vergeben&quot; - eine Rolle kann nur Rollen mit niedrigerem Rang zuweisen.
      </p>

      <div className="grid sm:grid-cols-2 gap-2">
        {roles.map((r) => {
          const permTags = [
            r.canEditPosts && "Posts bearbeiten",
            r.canManageDiscountCodes && "Rabattcodes",
            r.canAssignRoles && "Rollen vergeben",
            r.canDeleteUsers && "User löschen (bald)",
            !r.chatCanCreateChannels && "Keine Channels anlegen",
            r.chatCanDeleteOthersMessages && "Chat-Moderation",
            r.chatCanKickMembers && "Chat-Kick",
          ].filter(Boolean) as string[];

          return (
            <div key={r.name} className="border border-zinc-800 p-2" style={{ borderLeftColor: r.color, borderLeftWidth: 3 }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest truncate" style={{ color: r.color }}>{r.label}</p>
                  <span className="text-[8px] text-zinc-600 border border-zinc-800 px-1 py-0.5 shrink-0" title="Rang">
                    #{r.rank}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormMode({ mode: "edit", role: r })}
                    className="text-[9px] text-zinc-600 hover:text-white transition uppercase tracking-widest"
                  >
                    Bearbeiten
                  </button>
                  {r.name !== "admin" && (
                    <button
                      type="button"
                      onClick={() => { setDeleteErr(""); setDeletingRole(r); }}
                      className="text-[9px] text-zinc-600 hover:text-red-500 transition uppercase tracking-widest"
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[9px] text-zinc-500 mt-1 leading-relaxed">
                {r.sections.length === 0 ? "Keine Bereiche" : r.sections.map((s) => ADMIN_SECTION_LABELS[s]).join(", ")}
              </p>
              {permTags.length > 0 && (
                <p className="text-[9px] text-zinc-600 mt-1 leading-relaxed">
                  {permTags.join(" · ")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setFormMode((v) => (v?.mode === "create" ? null : { mode: "create" }))}
          className="text-[10px] uppercase tracking-widest border border-zinc-600 px-3 py-2 hover:bg-white hover:text-black transition-all font-bold">
          {formMode?.mode === "create" ? "Abbrechen" : "+ Neue Rolle erstellen"}
        </button>
      </div>

      {formMode && (
        <RoleForm
          key={formMode.mode === "edit" ? formMode.role.name : "create"}
          editing={formMode.mode === "edit" ? formMode.role : null}
          onSaved={(role) => {
            upsertRole(role);
            setFormMode(null);
          }}
          onCancel={() => setFormMode(null)}
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

          <div className="pt-3 border-t border-zinc-800">
            {user.pendingDeletionAt ? (
              <div className="space-y-2">
                <p className="text-[10px] text-red-500 uppercase tracking-widest">
                  ⚠ Gesperrt - Löschung geplant für{" "}
                  {new Date(user.pendingDeletionAt).toLocaleDateString("de-DE")}
                </p>
                <button type="button" onClick={handleCancelUserDeletion} disabled={userActionLoading}
                  className="text-[10px] border border-zinc-600 text-zinc-300 px-3 py-1.5 uppercase tracking-widest hover:bg-white hover:text-black transition disabled:opacity-50">
                  {userActionLoading ? "..." : "Löschung abbrechen"}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => { setUserActionErr(""); setConfirmingUserDeletion(true); }}
                className="text-[10px] border border-red-900 text-red-500 px-3 py-1.5 uppercase tracking-widest hover:bg-red-700 hover:text-white transition">
                Account löschen (7-Tage-Frist)
              </button>
            )}
            {userActionErr && <p className="text-[10px] text-red-500 uppercase tracking-widest mt-2">{userActionErr}</p>}
          </div>
        </div>
      )}

      {confirmingUserDeletion && (
        <ConfirmDeleteModal
          message={`Löschung für "${user?.username ?? user?.email}" einleiten? Der Account wird sofort gesperrt (7 Tage Frist), eine Email mit Einwandsmöglichkeit geht an ${user?.email}.`}
          loading={userActionLoading}
          onConfirm={confirmUserDeletion}
          onCancel={() => { if (!userActionLoading) setConfirmingUserDeletion(false); }}
        />
      )}

      {deletingRole && (
        <ConfirmDeleteModal
          message={`Rolle "${deletingRole.label}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`}
          loading={deleteLoading}
          onConfirm={confirmDeleteRole}
          onCancel={() => { if (!deleteLoading) setDeletingRole(null); }}
        />
      )}
      {deleteErr && (
        <ConfirmDeleteModal
          message={deleteErr}
          onConfirm={() => setDeleteErr("")}
          onCancel={() => setDeleteErr("")}
        />
      )}
    </div>
  );
}

function RoleForm({
  editing,
  onSaved,
  onCancel,
}: {
  editing: RoleConfig | null;
  onSaved: (role: RoleConfig) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [label, setLabel] = useState(editing?.label ?? "");
  const [color, setColor] = useState(editing?.color ?? "#a855f7");
  const [rank, setRank] = useState(editing?.rank ?? 0);
  const [canEditPosts, setCanEditPosts] = useState(editing?.canEditPosts ?? false);
  const [canManageDiscountCodes, setCanManageDiscountCodes] = useState(editing?.canManageDiscountCodes ?? false);
  const [canAssignRoles, setCanAssignRoles] = useState(editing?.canAssignRoles ?? false);
  const [canDeleteUsers, setCanDeleteUsers] = useState(editing?.canDeleteUsers ?? false);
  const [chatCanCreateChannels, setChatCanCreateChannels] = useState(editing?.chatCanCreateChannels ?? true);
  const [chatCanDeleteOthersMessages, setChatCanDeleteOthersMessages] = useState(editing?.chatCanDeleteOthersMessages ?? false);
  const [chatCanKickMembers, setChatCanKickMembers] = useState(editing?.chatCanKickMembers ?? false);
  const [sections, setSections] = useState<AdminSectionId[]>(editing?.sections ?? []);
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
      fd.append("rank", String(rank));
      fd.append("canEditPosts", String(canEditPosts));
      fd.append("canManageDiscountCodes", String(canManageDiscountCodes));
      fd.append("canAssignRoles", String(canAssignRoles));
      fd.append("canDeleteUsers", String(canDeleteUsers));
      fd.append("chatCanCreateChannels", String(chatCanCreateChannels));
      fd.append("chatCanDeleteOthersMessages", String(chatCanDeleteOthersMessages));
      fd.append("chatCanKickMembers", String(chatCanKickMembers));
      sections.forEach((s) => fd.append("sections", s));
      const res = await createOrUpdateRole(fd);
      if (res?.error) { setErr(res.error); return; }
      onSaved({
        name: name.trim().toLowerCase(),
        label: label.trim(),
        color,
        rank,
        sections,
        canEditPosts,
        canManageDiscountCodes,
        canAssignRoles,
        canDeleteUsers,
        chatCanCreateChannels,
        chatCanDeleteOthersMessages,
        chatCanKickMembers,
      });
    } catch (e) {
      console.error("Rolle speichern fehlgeschlagen:", e);
      setErr("Fehler. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="border border-zinc-700 p-4 space-y-4">
      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Interner Name (a-z, 0-9, -, _)</label>
          {editing ? (
            <p className="text-sm text-zinc-400 p-2 border border-zinc-800 bg-zinc-950">
              {name} <span className="text-[9px] text-zinc-600">(nicht änderbar)</span>
            </p>
          ) : (
            <input value={name} onChange={(e) => setName(e.target.value.toLowerCase())}
              placeholder="z.B. support"
              className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600" />
          )}
        </div>
        <div>
          <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Anzeigename</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="z.B. Support"
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white placeholder:text-zinc-600" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3">
          <label className="text-[9px] text-zinc-500 uppercase tracking-widest">Farbe</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 bg-transparent border border-zinc-700 cursor-pointer" />
        </div>
        <div>
          <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">
            Rang <span className="text-zinc-700">(höher = mehr Gewicht, steuert Reihenfolge & Hierarchie)</span>
          </label>
          <input type="number" min={0} max={1000} value={rank}
            onChange={(e) => setRank(Math.max(0, Math.min(1000, Number(e.target.value) || 0)))}
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white" />
        </div>
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

      <div>
        <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2">Admin-Berechtigungen</p>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={canEditPosts} onChange={(e) => setCanEditPosts(e.target.checked)} className="accent-white" />
            Darf bestehende Posts (Startseite/Newsletter) bearbeiten & löschen, nicht nur neu anlegen
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={canManageDiscountCodes} onChange={(e) => setCanManageDiscountCodes(e.target.checked)} className="accent-white" />
            Darf Rabattcodes verwalten (Erstbesteller- & Pre-Release-Codes)
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={canAssignRoles} onChange={(e) => setCanAssignRoles(e.target.checked)} className="accent-white" />
            Darf Rollen an User vergeben (nur Rollen mit niedrigerem Rang, nie die Admin-Rolle)
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer opacity-60">
            <input type="checkbox" checked={canDeleteUsers} onChange={(e) => setCanDeleteUsers(e.target.checked)} className="accent-white" />
            Darf User löschen <span className="text-zinc-600">(Schalter vorhanden, Funktion folgt noch)</span>
          </label>
        </div>
      </div>

      <div>
        <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2">Team-Chat-Rechte</p>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={chatCanCreateChannels} onChange={(e) => setChatCanCreateChannels(e.target.checked)} className="accent-white" />
            Darf neue Channels anlegen
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={chatCanDeleteOthersMessages} onChange={(e) => setChatCanDeleteOthersMessages(e.target.checked)} className="accent-white" />
            Darf Nachrichten anderer löschen (Chat-Moderation)
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={chatCanKickMembers} onChange={(e) => setChatCanKickMembers(e.target.checked)} className="accent-white" />
            Darf Mitglieder aus Channels entfernen
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} disabled={saving}
          className="flex-1 border border-zinc-700 text-zinc-300 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50">
          Abbrechen
        </button>
        <button type="submit" disabled={!name.trim() || !label.trim() || saving}
          className="flex-1 border border-white bg-white text-black py-2.5 text-[10px] uppercase tracking-widest font-black hover:bg-black hover:text-white transition-all disabled:opacity-40">
          {saving ? "..." : editing ? "Rolle aktualisieren" : "Rolle speichern"}
        </button>
      </div>
    </form>
  );
}
