"use client";
import { useState } from "react";
import { handleAction } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function CompleteChallengeButton({ challengeId }: { challengeId: number }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  async function submit() {
    setLoading(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("actionType", "completeChallenge");
    fd.append("challengeId", String(challengeId));
    const res = await handleAction(fd);
    setLoading(false);
    if (res.error) {
      setMsg({ text: res.error, type: "error" });
      return;
    }
    setMsg({ text: typeof res.success === "string" ? res.success : "Erledigt!", type: "success" });
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button onClick={submit} disabled={loading}
        className="border t-border px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition disabled:opacity-50 t-text">
        {loading ? "..." : "Als erledigt markieren"}
      </button>
      {msg && (
        <p className={`text-[10px] uppercase tracking-widest ${msg.type === "error" ? "text-red-500" : "text-green-500"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
