"use client";

import { useState } from "react";
import { handleAction } from "@/app/actions";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (newPassword.length < 8) {
      setMsg({ text: "Neues Passwort: mindestens 8 Zeichen.", type: "error" });
      return;
    }
    if (newPassword !== newPassword2) {
      setMsg({ text: "Neue Passwörter stimmen nicht überein.", type: "error" });
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.append("actionType", "changePassword");
    fd.append("currentPassword", currentPassword);
    fd.append("newPassword", newPassword);
    const res = await handleAction(fd);
    setLoading(false);

    if (res.error) {
      setMsg({ text: res.error, type: "error" });
      return;
    }

    setMsg({ text: "Passwort erfolgreich geändert.", type: "success" });
    setCurrentPassword("");
    setNewPassword("");
    setNewPassword2("");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="AKTUELLES PASSWORT"
        required
        className="w-full bg-black/80 border-b border-zinc-600 p-2 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white"
      />
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="NEUES PASSWORT"
        required
        className="w-full bg-black/80 border-b border-zinc-600 p-2 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white"
      />
      <input
        type="password"
        value={newPassword2}
        onChange={(e) => setNewPassword2(e.target.value)}
        placeholder="NEUES PASSWORT BESTÄTIGEN"
        required
        className="w-full bg-black/80 border-b border-zinc-600 p-2 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white"
      />

      {msg && (
        <p
          className={`text-[10px] text-center uppercase tracking-widest ${
            msg.type === "error" ? "text-red-600" : "text-green-500"
          }`}
        >
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full border border-zinc-500 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50"
      >
        {loading ? "..." : "Passwort speichern"}
      </button>
    </form>
  );
}
