"use client";
import { useEffect } from "react";

export default function ThemeScript() {
  useEffect(() => {
    try {
      const m = document.cookie.match(/bellator-theme=([^;]+)/);
      if (m) document.documentElement.setAttribute("data-theme", m[1]);
    } catch {}
  }, []);
  return null;
}
