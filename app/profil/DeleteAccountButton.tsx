"use client";
import { useState } from "react";
import { handleAction } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function DeleteAccountButton() {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const fd = new FormData();
    fd.append("actionType", "deleteAccount");
    const res = await handleAction(fd);
    setLoading(false);
    if (res.success) router.push("/login");
  }

  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)}
        className="border border-red-800 text-red-600 py-2 px-4 text-xs uppercase tracking-widest hover:bg-red-900 hover:text-white transition">
        Account löschen
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-red-400 uppercase tracking-widest">Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden.</p>
      <div className="flex gap-3">
        <button onClick={handleDelete} disabled={loading}
          className="border border-red-600 text-red-500 py-2 px-4 text-xs uppercase tracking-widest hover:bg-red-900 hover:text-white transition disabled:opacity-50">
          {loading ? "..." : "Ja, Account löschen"}
        </button>
        <button onClick={() => setConfirm(false)}
          className="border border-zinc-600 text-zinc-400 py-2 px-4 text-xs uppercase tracking-widest hover:border-white hover:text-white transition">
          Abbrechen
        </button>
      </div>
    </div>
  );
}
