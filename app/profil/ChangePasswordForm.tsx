"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { handleAction } from "@/app/actions";

function PasswordField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-black/80 border-b border-zinc-600 p-2 pr-9 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

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
    try {
      const fd = new FormData();
      fd.append("actionType", "changePassword");
      fd.append("currentPassword", currentPassword);
      fd.append("newPassword", newPassword);
      const res = await handleAction(fd);

      if (res.error) {
        setMsg({ text: res.error, type: "error" });
        return;
      }

      setMsg({ text: "Passwort erfolgreich geändert.", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (e) {
      console.error("Passwort ändern fehlgeschlagen:", e);
      setMsg({ text: "Fehler. Bitte nochmal versuchen.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PasswordField value={currentPassword} onChange={setCurrentPassword} placeholder="AKTUELLES PASSWORT" />
      <PasswordField value={newPassword} onChange={setNewPassword} placeholder="NEUES PASSWORT" />
      <PasswordField value={newPassword2} onChange={setNewPassword2} placeholder="NEUES PASSWORT BESTÄTIGEN" />

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
