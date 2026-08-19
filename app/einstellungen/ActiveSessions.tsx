"use client";

import { useEffect, useState } from "react";
import { handleAction } from "@/app/actions";
import { parseUserAgent } from "@/app/utils/userAgent";

type SessionEntry = {
  sessionId: string;
  userAgent: string | null;
  createdAt: string | Date | null;
  lastSeenAt: string | Date | null;
  isCurrent: boolean;
};

function formatRelative(date: string | Date | null): string {
  if (!date) return "unbekannt";
  const ms = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days === 1 ? "" : "en"}`;
}

export default function ActiveSessions() {
  const [sessions, setSessions] = useState<SessionEntry[] | null>(null);
  const [pending, setPending] = useState<string | null>(null); // sessionId gerade in Bearbeitung, oder "all"
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function load() {
    const fd = new FormData();
    fd.append("actionType", "getActiveSessions");
    const res = await handleAction(fd);
    if (res?.sessions) setSessions(res.sessions as SessionEntry[]);
    else if (res?.error) setMsg({ text: res.error, type: "error" });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fd = new FormData();
      fd.append("actionType", "getActiveSessions");
      const res = await handleAction(fd);
      if (cancelled) return;
      if (res?.sessions) setSessions(res.sessions as SessionEntry[]);
      else if (res?.error) setMsg({ text: res.error, type: "error" });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function revoke(sessionId: string) {
    setPending(sessionId);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("actionType", "revokeSession");
      fd.append("sessionId", sessionId);
      const res = await handleAction(fd);
      if (res?.error) {
        setMsg({ text: res.error, type: "error" });
      } else {
        setMsg({ text: "✓ Gerät ausgeloggt.", type: "success" });
        await load();
      }
    } finally {
      setPending(null);
    }
  }

  async function revokeAllOthers() {
    setPending("all");
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("actionType", "revokeAllOtherSessions");
      const res = await handleAction(fd);
      if (res?.error) {
        setMsg({ text: res.error, type: "error" });
      } else {
        setMsg({ text: "✓ Alle anderen Geräte ausgeloggt.", type: "success" });
        await load();
      }
    } finally {
      setPending(null);
    }
  }

  if (sessions === null) {
    return <p className="text-xs t-faint">Lädt...</p>;
  }

  const otherCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.sessionId} className="flex items-center justify-between border t-border-s px-3 py-2.5">
            <div>
              <p className="text-xs">
                {parseUserAgent(s.userAgent)}
                {s.isCurrent && (
                  <span className="ml-2 text-[9px] uppercase tracking-widest text-green-500 border border-green-800 px-1.5 py-0.5">
                    Dieses Gerät
                  </span>
                )}
              </p>
              <p className="text-[10px] t-faint mt-0.5">
                Zuletzt aktiv {formatRelative(s.lastSeenAt)} · angemeldet seit {formatRelative(s.createdAt)}
              </p>
            </div>
            {!s.isCurrent && (
              <button
                onClick={() => revoke(s.sessionId)}
                disabled={pending !== null}
                className="text-[10px] uppercase tracking-widest text-red-500 hover:text-red-400 transition disabled:opacity-50 shrink-0 ml-3"
              >
                {pending === s.sessionId ? "..." : "Ausloggen"}
              </button>
            )}
          </div>
        ))}
      </div>

      {otherCount > 0 && (
        <button
          onClick={revokeAllOthers}
          disabled={pending !== null}
          className="w-full t-btn-outline py-2.5 font-black text-xs uppercase tracking-widest transition disabled:opacity-50"
        >
          {pending === "all" ? "..." : `Alle anderen Geräte ausloggen (${otherCount})`}
        </button>
      )}

      {msg && (
        <p className={`text-[10px] uppercase tracking-widest ${msg.type === "success" ? "text-green-500" : "text-red-500"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
