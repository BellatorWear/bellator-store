"use client";

import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "false");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        right: "20px",
        background: "#000",
        border: "2px solid #fff",
        padding: "1.5rem",
        color: "#fff",
        zIndex: 9999,
        fontFamily: "Courier New, monospace",
        boxShadow: "10px 10px 0px 0px #333",
      }}
    >
      <p
        style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", lineHeight: "1.4" }}
      >
        Wir nutzen Cookies für den Shop-Vibe. Akzeptier das, damit alles läuft.
      </p>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={acceptCookies}
          style={{
            background: "#fff",
            color: "#000",
            border: "none",
            padding: "0.8rem 1.5rem",
            fontWeight: "900",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Akzeptieren
        </button>
        <button
          onClick={declineCookies}
          style={{
            background: "transparent",
            color: "#fff",
            border: "1px solid #fff",
            padding: "0.8rem 1.5rem",
            fontWeight: "900",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Ablehnen
        </button>
      </div>
    </div>
  );
}
