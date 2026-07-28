/**
 * Schutz gegen Open Redirect über den "next"-Query-Parameter (z.B.
 * /login?next=...). Ohne Prüfung könnte ein Link wie
 * /login?next=//evil.com oder /login?next=https://evil.com so gebaut
 * werden, dass der Browser nach einem erfolgreichen (echten!) Login auf
 * eine fremde Domain weiterleitet - klassischer Phishing-Vektor, weil die
 * Person gerade noch auf der echten Login-Seite war.
 *
 * Erlaubt wird NUR ein Pfad, der mit genau einem "/" beginnt - kein "//"
 * (Browser interpretieren das als protokoll-relative URL zu einer fremden
 * Domain) und kein "/\" (manche Browser normalisieren Backslash zu
 * Slash, gleicher Trick).
 */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
