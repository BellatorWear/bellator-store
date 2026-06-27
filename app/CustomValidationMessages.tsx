"use client";
import { useEffect } from "react";

// Ersetzt die native "Please fill out this field" Browser-Sprechblase durch
// ein eigenes, zum Bellator-Look passendes Tooltip - global für ALLE
// Formulare der Seite, ohne dass jedes Formular einzeln angepasst werden muss.
function germanMessage(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string {
  const v = el.validity;
  if (v.valueMissing) return "Bitte ausfüllen.";
  if (v.typeMismatch && el.type === "email") return "Bitte eine gültige Email-Adresse eingeben.";
  if (v.tooShort) return `Mindestens ${(el as HTMLInputElement).minLength} Zeichen.`;
  if (v.tooLong) return `Höchstens ${(el as HTMLInputElement).maxLength} Zeichen.`;
  if (v.patternMismatch) return "Ungültiges Format.";
  if (v.rangeUnderflow || v.rangeOverflow) return "Ungültiger Wert.";
  return el.validationMessage || "Ungültige Eingabe.";
}

export default function CustomValidationMessages() {
  useEffect(() => {
    let tooltipEl: HTMLDivElement | null = null;

    function removeTooltip() {
      tooltipEl?.remove();
      tooltipEl = null;
    }

    function showTooltip(target: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
      removeTooltip();
      const rect = target.getBoundingClientRect();
      const tip = document.createElement("div");
      tip.textContent = germanMessage(target);
      tip.style.position = "fixed";
      tip.style.left = `${rect.left}px`;
      tip.style.top = `${rect.bottom + 6}px`;
      tip.style.zIndex = "9999";
      tip.style.background = "#dc2626";
      tip.style.color = "#fff";
      tip.style.fontSize = "10px";
      tip.style.fontWeight = "700";
      tip.style.textTransform = "uppercase";
      tip.style.letterSpacing = "0.08em";
      tip.style.padding = "6px 10px";
      tip.style.fontFamily = "ui-monospace, 'Courier New', monospace";
      tip.style.boxShadow = "3px 3px 0px 0px rgba(0,0,0,0.4)";
      tip.style.pointerEvents = "none";
      tip.setAttribute("data-bellator-validation-tooltip", "true");
      document.body.appendChild(tip);
      tooltipEl = tip;
      target.style.outline = "2px solid #dc2626";
      target.style.outlineOffset = "1px";
    }

    function onInvalid(e: Event) {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (!("validity" in target)) return;
      e.preventDefault(); // native Sprechblase unterdrücken
      showTooltip(target);
    }

    function onInput(e: Event) {
      const target = e.target as HTMLElement;
      target.style.outline = "";
      target.style.outlineOffset = "";
      removeTooltip();
    }

    function onScrollOrResize() {
      removeTooltip();
    }

    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("focusout", removeTooltip, true);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("focusout", removeTooltip, true);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      removeTooltip();
    };
  }, []);

  return null;
}
