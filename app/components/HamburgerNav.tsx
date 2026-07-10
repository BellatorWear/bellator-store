"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import RedeemCodeButton, { type RedeemCodeButtonHandle } from "@/app/shop/components/RedeemCodeButton";

type NavProps = {
  cartCount?: number;
  isAdmin?: boolean;
  username?: string | null;
};

const LINKS = [
  { href: "/", label: "Startseite" },
  { href: "/shop", label: "Shop" },
  { href: "/news", label: "News" },
  { href: "/shop/challenges", label: "Challenges & Punkte" },
  { href: "/profil", label: "Profil" },
  { href: "/einstellungen", label: "Einstellungen" },
  { href: "/mehr", label: "Mehr" },
];

export default function HamburgerNav({ cartCount = 0, isAdmin, username }: NavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const redeemRef = useRef<RedeemCodeButtonHandle | null>(null);
  useEffect(() => setMounted(true), []);

  // Scroll sperren wenn Menü offen
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const menu = open && mounted ? createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Panel */}
      <div className="fixed top-0 right-0 z-[401] h-full w-[80vw] sm:w-[340px] lg:w-[22vw] bg-black border-l border-zinc-700 flex flex-col font-mono">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <Link href="/" onClick={() => setOpen(false)} className="text-xl font-black uppercase tracking-tighter italic text-white hover:opacity-70 transition">
            BELLATOR.
          </Link>
          <button onClick={() => setOpen(false)} className="border border-zinc-600 p-2 hover:border-white transition text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {username && (
          <div className="px-5 py-3 border-b border-zinc-800">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Eingeloggt als</p>
            <p className="text-sm font-bold text-white mt-0.5">{username}</p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-3 text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-700"
            >
              {label}
            </Link>
          ))}

          <Link
            href="/shop/warenkorb"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-4 py-3 text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-700"
          >
            <span>Warenkorb</span>
            {cartCount > 0 && (
              <span className="bg-white text-black text-[10px] font-black px-2 py-0.5 min-w-[20px] text-center">
                {cartCount}
              </span>
            )}
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-3 text-sm font-bold uppercase tracking-widest text-purple-400 hover:text-purple-300 hover:bg-zinc-900 transition-all border border-transparent hover:border-purple-800"
            >
              Admin Panel
            </Link>
          )}

          <a
            href="https://discord.gg/T4RwVJRyRp"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-widest bg-white text-black hover:bg-black hover:text-white border-[3px] border-white transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.102 18.079.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Discord
          </a>
        </nav>

        <div className="border-t border-zinc-800 p-4">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              redeemRef.current?.open();
            }}
            className="w-full border t-border py-2.5 text-[10px] sm:text-xs uppercase tracking-widest font-bold t-text hover:bg-white hover:text-black transition-all"
          >
            Code eingeben
          </button>
        </div>
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-zinc-600 p-2 hover:border-white transition text-white flex flex-col gap-[4px] items-center justify-center w-9 h-9"
        aria-label="Menü öffnen"
      >
        <span className="w-4 h-[2px] bg-current" />
        <span className="w-4 h-[2px] bg-current" />
        <span className="w-4 h-[2px] bg-current" />
      </button>
      {menu}
      <RedeemCodeButton ref={redeemRef} variant="hidden" />
    </>
  );
}
