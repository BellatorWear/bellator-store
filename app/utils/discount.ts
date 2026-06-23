// Rabatt basierend auf Bestellanzahl (automatisch berechnet)
export function calculateDiscount(orderCount: number): number {
  if (orderCount >= 10) return 20; // 20% ab 10 Bestellungen
  if (orderCount >= 5) return 10; // 10% ab 5 Bestellungen
  if (orderCount >= 3) return 5; // 5%  ab 3 Bestellungen
  return 0;
}
