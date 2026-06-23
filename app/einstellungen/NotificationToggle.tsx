"use client";
import { useState } from "react";
import { handleAction } from "@/app/actions";

export default function NotificationToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function toggle() {
    if (!("Notification" in window)) {
      setMsg("Dein Browser unterstützt keine Push-Benachrichtigungen.");
      return;
    }
    setLoading(true);
    if (!enabled) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setEnabled(true);
        setMsg("Push-Benachrichtigungen aktiviert!");
        // Hier Web Push Subscription speichern (erfordert VAPID Setup)
        const fd = new FormData();
        fd.append("actionType", "enablePush");
        await handleAction(fd);
      } else {
        setMsg("Berechtigung verweigert.");
      }
    } else {
      setEnabled(false);
      setMsg("Push-Benachrichtigungen deaktiviert.");
    }
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
