type PriceDisplayProps = {
  priceCents: number;
  compareAtPriceCents?: number | null;
  size?: "sm" | "lg";
};

/**
 * Zeigt einen Preis an. Wenn ein höherer "compareAtPriceCents" (alter Preis)
 * mitgegeben wird, wird dieser links durchgestrichen (als rotes X über dem
 * Text, keine einfache Linie) und der neue, reduzierte Preis erscheint
 * rechts daneben leicht schräg gestellt - genau wie auf einem
 * Rabatt-Preisschild.
 */
export default function PriceDisplay({ priceCents, compareAtPriceCents, size = "lg" }: PriceDisplayProps) {
  const hasDiscount = !!compareAtPriceCents && compareAtPriceCents > priceCents;
  const big = size === "lg" ? "text-lg sm:text-xl" : "text-base";
  const small = size === "lg" ? "text-base sm:text-lg" : "text-sm";

  if (!hasDiscount) {
    return (
      <p className={`${big} font-black t-text border-l-4 border-red-600 pl-3`}>
        {(priceCents / 100).toFixed(2)} €
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3 border-l-4 border-red-600 pl-3">
      <span className={`relative inline-block ${small} font-bold t-faint`}>
        {(compareAtPriceCents! / 100).toFixed(2)} €
        {/* Rotes Kreuz über dem alten Preis statt einer einfachen Linie */}
        <span className="pointer-events-none absolute left-[-4%] top-1/2 h-[2px] w-[108%] bg-red-600 -translate-y-1/2 rotate-[14deg]" />
        <span className="pointer-events-none absolute left-[-4%] top-1/2 h-[2px] w-[108%] bg-red-600 -translate-y-1/2 -rotate-[14deg]" />
      </span>
      <span className={`${big} font-black text-green-500 inline-block -rotate-2`}>
        {(priceCents / 100).toFixed(2)} €
      </span>
    </div>
  );
}
