"use client";
import { useState } from "react";
import { handleAction } from "@/app/actions";

export default function NewsletterToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function toggle() {
    setLoading(true);
    setMsg("");
    const fd = new FormData();
    fd.append("actionType", "toggleNewsletter");
    fd.append("enable", String(!enabled));
    await handleAction(fd);
    setEnabled(!enabled);
    setMsg(!enabled ? "Newsletter abonniert!" : "Newsletter abbestellt.");
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={toggle} disabled={loading}
        className={`relative w-14 h-7 border transition-all disabled:opacity-50 ${enabled ? "border-white bg-white" : "t-border t-card"}`}>
        <span className={`absolute top-1 w-5 h-5 transition-all ${enabled ? "right-1 bg-black" : "left-1 bg-white"}`} />
      </button>
      {msg && <p className="text-[9px] t-muted max-w-[140px] text-right">{msg}</p>}
    </div>
  );
}
