import crypto from "crypto";
import { generateSecret, generateURI, verify } from "otplib";

// ===================================================================
// Verschlüsselung des TOTP-Secrets (AES-256-GCM). Key wird deterministisch
// aus SESSION_SECRET abgeleitet (scrypt) - kein zusätzlicher Env-Var
// nötig, aber trotzdem nie derselbe Schlüssel wie die Session-Signatur
// selbst (andere Salt/Zweck). Das Secret erlaubt jedem, der es kennt,
// beliebige gültige TOTP-Codes zu erzeugen - es landet deshalb nie im
// Klartext in der DB.
// ===================================================================
function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET ist nicht gesetzt oder zu kurz (mind. 32 Zeichen).");
  }
  return crypto.scryptSync(secret, "mfa-totp-encryption", 32);
}

export function encryptSecret(plain: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // iv.authTag.ciphertext, alles base64url
  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(encoded: string): string {
  const [ivB64, tagB64, dataB64] = encoded.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Ungültiges verschlüsseltes Secret.");
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64url")), decipher.final()]);
  return decrypted.toString("utf8");
}

// ===================================================================
// TOTP (Authenticator App - Google Authenticator, Authy, 1Password, ...)
// ===================================================================
export function generateTotpSecret(): string {
  return generateSecret();
}

export function totpKeyUri(secret: string, email: string): string {
  return generateURI({ issuer: "Bellator Streetwear", label: email, secret });
}

export async function verifyTotpCode(secret: string, token: string): Promise<boolean> {
  try {
    // ±1 Zeitfenster (30s) Toleranz gegen leichten Uhr-Drift zwischen
    // Server und Handy, wie bei den meisten Authenticator-Setups üblich.
    const result = await verify({ secret, token: token.trim(), epochTolerance: [30, 30] });
    return result.valid;
  } catch {
    return false;
  }
}

// ===================================================================
// Kurzcode für Email/SMS (6-stellig, wie TOTP-Codes gewohnt)
// ===================================================================
export function generateNumericCode(digits = 6): string {
  const max = 10 ** digits;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(digits, "0");
}

export function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// ===================================================================
// Backup-Codes (Einmal-Nutzung, falls Authenticator/Telefon fehlt)
// ===================================================================
export function generateBackupCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    // Format xxxx-xxxx, gut lesbar/abtippbar
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
  });
}

// ===================================================================
// Kurzlebiger, signierter "Passwort bereits verifiziert, MFA steht noch
// aus"-Token fürs Login - bewusst getrennt vom echten Session-Token
// (lib/session.ts), damit ein Angreifer mit diesem Zwischen-Token allein
// keinen vollen Zugriff bekommt, falls er ihn irgendwie abgreift.
// ===================================================================
type MfaPendingPayload = { userId: number; iat: number };

function getPendingSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET ist nicht gesetzt oder zu kurz (mind. 32 Zeichen).");
  }
  return secret;
}

const MFA_PENDING_MAX_AGE_MS = 5 * 60 * 1000; // 5 Minuten

export function createMfaPendingToken(userId: number): string {
  const payload: MfaPendingPayload = { userId, iat: Date.now() };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", getPendingSecret()).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyMfaPendingToken(token: string): number | null {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;
    const expectedSig = crypto.createHmac("sha256", getPendingSecret()).update(payloadB64).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as MfaPendingPayload;
    if (typeof payload.userId !== "number" || typeof payload.iat !== "number") return null;
    if (Date.now() - payload.iat > MFA_PENDING_MAX_AGE_MS) return null;
    return payload.userId;
  } catch {
    return null;
  }
}
