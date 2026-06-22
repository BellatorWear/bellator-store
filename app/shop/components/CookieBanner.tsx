'use client'

import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Prüfen, ob der User bereits zugestimmt hat
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      background: '#000',
      border: '2px solid #fff',
      padding: '1.5rem',
      color: '#fff',
      zIndex: 9999,
      fontFamily: 'Courier New, monospace',
      boxShadow: '10px 10px 0px 0px #333'
    }}>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
        Wir nutzen Cookies für den Shop-Vibe. Akzeptier das, damit alles läuft.
      </p>
      <button 
        onClick={acceptCookies}
        style={{
          background: '#fff',
          color: '#000',
          border: 'none',
          padding: '0.8rem 1.5rem',
          fontWeight: '900',
          textTransform: 'uppercase',
          cursor: 'pointer'
        }}
      >
        Alles klar, akzeptieren
      </button>
    </div>
  );
}