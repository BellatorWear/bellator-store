"use client";
import { useState, useEffect } from "react";
import { handleAction } from "@/app/actions";

export default function ThemeToggle({ currentTheme }: { currentTheme: string }) {
  const [theme, setTheme] = useState(currentTheme);
  const [loading, setLoading] = useState(false);

  // Theme beim Laden der Seite anwenden
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  async function toggle() {
    const newTheme = theme === "dark" ? "light" : "dark";
    setLoading(true);
    document.documentElement.setAttribute("data-theme", newTheme);
    const fd = new FormData();
    fd.append("actionType", "setTheme");
    fd.append("theme", newTheme);
    await handleAction(fd);
    setTheme(newTheme);
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 uppercase tracking-widest">{theme === "dark" ? "Dunkel" : "Hell"}</span>
      <button onClick={toggle} disabled={loading}
        className={`relative w-14 h-7 border transition-all disabled:opacity-50 ${theme === "light" ? "border-white bg-white" : "border-zinc-600 bg-zinc-900"}`}>
        <span className={`absolute top-1 w-5 h-5 transition-all ${theme === "light" ? "right-1 bg-black" : "left-1 bg-white"}`} />
      </button>
    </div>
  );
}
