export const USERNAME_COOLDOWN_DAYS = 7;
export const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/; // fest, linear, kein ReDoS-Risiko

export function daysUntilUsernameChangeAllowed(lastChanged: Date | null): number {
  if (!lastChanged) return 0;
  const msSince = Date.now() - new Date(lastChanged).getTime();
  const daysSince = msSince / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(USERNAME_COOLDOWN_DAYS - daysSince));
}
