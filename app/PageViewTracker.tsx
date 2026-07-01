"use client";
import { useEffect } from "react";

export default function PageViewTracker() {
  useEffect(() => {
    // Einmal pro Seiten-Mount - nicht mehr, kein Cookie nötig.
    // "fire and forget" - wir warten nicht auf die Antwort.
    fetch("/api/pageview", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
