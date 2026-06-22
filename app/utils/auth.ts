// Diese Datei hat früher Cookies.set('bellator-access', key, ...) direkt im
// Browser (also client-seitig, nicht httpOnly) gesetzt. Das war doppelt
// problematisch:
//   1) Die eigentliche Auth-Session wird serverseitig per httpOnly-Cookie
//      gesetzt (siehe lib/session.ts) — ein zusätzlicher, von JS lesbarer
//      Cookie mit ähnlichem Namen ist unnötig und ein Sicherheitsrisiko,
//      weil clientseitig gesetzte, nicht httpOnly Cookies grundsätzlich von
//      jedem Script auf der Seite (z.B. bei einer XSS-Lücke) gelesen und
//      manipuliert werden können.
//   2) Diese Funktion wurde im Code nirgends mehr verwendet.
//
// Die Datei bleibt als Platzhalter bestehen, falls woanders noch darauf
// referenziert wird, exportiert aber bewusst keine sicherheitsrelevante
// Cookie-Logik mehr. Die Session-Cookies werden ausschließlich serverseitig
// in lib/session.ts verwaltet.
export {};
