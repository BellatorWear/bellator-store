"use client";
import { useEffect } from "react";
import { playHoverSound, playClickSound } from "./LandingSound";

const INTERACTIVE_SELECTOR = 'button, a, [role="button"], input[type="submit"], input[type="button"]';

/**
 * Statt in jeder einzelnen Komponente Hover-/Klick-Handler zu ergänzen
 * (hunderte Stellen, jede neue Komponente würde es sonst wieder vergessen),
 * hört diese Komponente global auf Events und erkennt interaktive Elemente
 * per closest(). Deckt dadurch wirklich ALLE Buttons/Links ab, inklusive
 * Header, Footer, Modals - auch zukünftig neu hinzugefügte.
 */
export default function GlobalSoundEffects() {
  useEffect(() => {
    let lastHoverTarget: Element | null = null;

    function isDisabled(el: Element): boolean {
      return el.matches(":disabled, [aria-disabled='true'], [data-no-sound]");
    }

    function handlePointerOver(e: PointerEvent) {
      // Nur "echte" Maus-Hovers - auf Touch-Geräten gibt es kein Hover,
      // dort übernimmt die Klick-Animation (siehe CSS) die Rückmeldung.
      if (e.pointerType !== "mouse") return;
      const target = (e.target as Element)?.closest(INTERACTIVE_SELECTOR);
      if (!target || target === lastHoverTarget || isDisabled(target)) return;
      lastHoverTarget = target;
      playHoverSound();
    }

    function handlePointerOut(e: PointerEvent) {
      const target = (e.target as Element)?.closest(INTERACTIVE_SELECTOR);
      if (target === lastHoverTarget) lastHoverTarget = null;
    }

    function handleClick(e: MouseEvent) {
      const target = (e.target as Element)?.closest(INTERACTIVE_SELECTOR);
      if (!target || isDisabled(target)) return;
      playClickSound();
    }

    document.addEventListener("pointerover", handlePointerOver, true);
    document.addEventListener("pointerout", handlePointerOut, true);
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("pointerover", handlePointerOver, true);
      document.removeEventListener("pointerout", handlePointerOut, true);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
