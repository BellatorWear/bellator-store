/**
 * Cloudflare Turnstile - Bot-Schutz für öffentliche, missbrauchsanfällige
 * Formulare (Login, Registrierung, Passwort-vergessen). Kostenlos, kein
 * Cloudflare-Proxy vor der Seite nötig - reiner Widget-Service.
 *
 * SETUP (muss Michael einmalig machen, kann ich nicht automatisieren):
 * 1. https://dash.cloudflare.com -> Turnstile -> "Add Site"
 * 2. Domain eintragen (mz-dev.de), Widget-Typ "Managed" wählen
 * 3. Zwei Keys bekommen: Site Key (öffentlich, geht ins Frontend) und
 *    Secret Key (geheim, nur Server)
 * 4. Als Vercel-Umgebungsvariablen eintragen:
 *      NEXT_PUBLIC_TURNSTILE_SITE_KEY = <Site Key>
 *      TURNSTILE_SECRET_KEY = <Secret Key>
 *
 * FAIL-OPEN, solange nicht konfiguriert: ohne die beiden Env-Vars wird die
 * Prüfung übersprungen (mit Warnung im Server-Log), damit Login/Registrierung
 * nicht kaputtgehen, bevor Michael die Keys eingetragen hat. Sobald beide
 * Variablen gesetzt sind, ist der Schutz automatisch aktiv - kein
 * Code-Update nötig.
 */
export async function verifyTurnstile(token: string | null, remoteIp?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY nicht gesetzt - Bot-Schutz übersprungen.");
    return true;
  }
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("[turnstile] Verifizierung fehlgeschlagen:", error);
    // Fail-open bei Netzwerkfehlern zu Cloudflare - ein Ausfall des
    // Bot-Schutz-Anbieters soll nicht die ganze Anmeldung lahmlegen.
    // Die bestehenden Rate-Limits bleiben in diesem Fall die primäre
    // Absicherung.
    return true;
  }
}
