"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { handleAction } from "@/app/actions";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function logout() {
    setLoading(true);
    const fd = new FormData();
    fd.append("actionType", "logout");
    await handleAction(fd);
    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="border border-red-700 text-red-500 py-3 px-6 font-bold text-xs uppercase tracking-widest hover:bg-red-700 hover:text-white transition-all disabled:opacity-50"
    >
      {loading ? "..." : "Ausloggen"}
    </button>
  );
}
