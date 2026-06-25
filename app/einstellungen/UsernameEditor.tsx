"use client";
import { useState } from "react";
import { handleAction } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function UsernameEditor({
  currentUsername,
  cooldownDays,
}: {
  currentUsername: string | null;
  cooldownDays: number;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentUsername ?? "");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    setLoading(true);
    setErr("");
    const fd = new FormData();
    fd.append("actionType", "setUsername");
    fd.append("username", value);
    const res = await handleAction(fd);
    setLoading(false);
    if (res.error) {
      setErr(typeof res.error === "string" ? res.error : "Fehler.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex justify-between items-center py-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest">Benutzername</p>
          <p className="text-xs t-muted mt-0.5">@{currentUsername ?? "—"}</p>
          {cooldownDays > 0 && (
            <p className="text-[10px] t-faint mt-0.5">Änderbar in {cooldownDays} Tag(en)</p>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          disabled={cooldownDays > 0}
          className="border t-border px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition disabled:opacity-40 t-text"
        >
          Ändern
        </button>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-2">
      <p className="text-sm font-bold uppercase tracking-widest">Benutzername ändern</p>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={20}
        className="w-full t-input border p-2 text-sm tracking-widest"
      />
      {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={loading}
          className="border t-border px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition disabled:opacity-50 t-text">
          {loading ? "..." : "Speichern"}
        </button>
        <button onClick={() => { setEditing(false); setErr(""); setValue(currentUsername ?? ""); }}
          className="border t-border px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold t-muted hover:t-text transition">
          Abbrechen
        </button>
      </div>
    </div>
  );
}
