"use server";

import { db } from "@/db";
import { users, mfaBackupCodes } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/app/actions";
import { isTrustedOrigin } from "@/app/utils/origin";
import { checkMfaVerifyRateLimit } from "@/app/utils/ratelimit";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session";
import {
  generateTotpSecret,
  totpKeyUri,
  verifyTotpCode,
  encryptSecret,
  decryptSecret,
  generateBackupCodes,
  hashCode,
  verifyMfaPendingToken,
} from "@/lib/mfa";
import { logAuditEvent } from "@/app/utils/auditLog";

const MFA_PENDING_COOKIE = "bellator-mfa-pending";

/**
 * Schritt 1: neues TOTP-Secret erzeugen, verschlüsselt zwischenspeichern
 * (mfaEnabled bleibt false, bis der User einen echten Code bestätigt hat -
 * ein unbestätigtes Secret ohne aktives MFA ist harmlos).
 */
export async function startTotpSetup(): Promise<{ error?: string; qrDataUrl?: string; secret?: string }> {
  if (!(await isTrustedOrigin())) return { error: "Anfrage abgelehnt." };
  const user = await getCurrentUser();
  if (!user) return { error: "Bitte einloggen." };
  if (user.mfaEnabled) return { error: "2FA ist bereits aktiv. Erst deaktivieren, um die Methode zu wechseln." };

  const secret = generateTotpSecret();
  const encrypted = encryptSecret(secret);
  await db.update(users).set({ totpSecretEncrypted: encrypted }).where(eq(users.id, user.id));

  const uri = totpKeyUri(secret, user.email);
  const qrDataUrl = await QRCode.toDataURL(uri);

  return { qrDataUrl, secret };
}

/**
 * Schritt 2: User gibt den ersten echten Code aus der App ein - erst
 * danach wird MFA wirklich scharf geschaltet, plus Backup-Codes.
 */
export async function confirmTotpSetup(formData: FormData): Promise<{ error?: string; backupCodes?: string[] }> {
  if (!(await isTrustedOrigin())) return { error: "Anfrage abgelehnt." };
  const user = await getCurrentUser();
  if (!user) return { error: "Bitte einloggen." };

  const code = ((formData.get("code") as string) ?? "").trim();
  if (!/^\d{6}$/.test(code)) return { error: "Bitte den 6-stelligen Code eingeben." };

  const [row] = await db.select().from(users).where(eq(users.id, user.id));
  if (!row?.totpSecretEncrypted) return { error: "Kein Setup gestartet. Bitte QR-Code erneut anzeigen." };

  const secret = decryptSecret(row.totpSecretEncrypted);
  const valid = await verifyTotpCode(secret, code);
  if (!valid) return { error: "Code ungültig oder abgelaufen." };

  const backupCodes = generateBackupCodes();
  await db.update(users).set({ mfaEnabled: true, mfaMethod: "totp" }).where(eq(users.id, user.id));
  await db.delete(mfaBackupCodes).where(eq(mfaBackupCodes.userId, user.id));
  await db.insert(mfaBackupCodes).values(backupCodes.map((c) => ({ userId: user.id, codeHash: hashCode(c) })));

  await logAuditEvent("mfa.enabled", { targetType: "user", targetId: user.id, details: { method: "totp" } });

  return { backupCodes };
}

/**
 * MFA deaktivieren - verlangt das aktuelle Passwort zur Bestätigung
 * (sonst könnte jemand mit einer offenen Session allein den Schutz
 * abschalten, ganz ohne irgendwas zu wissen).
 */
export async function disableMfa(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  if (!(await isTrustedOrigin())) return { error: "Anfrage abgelehnt." };
  const user = await getCurrentUser();
  if (!user) return { error: "Bitte einloggen." };

  const password = (formData.get("password") as string) ?? "";
  const [row] = await db.select().from(users).where(eq(users.id, user.id));
  if (!row?.passwordHash) return { error: "Kein Passwort gesetzt." };

  const valid = await bcrypt.compare(password, row.passwordHash);
  if (!valid) return { error: "Falsches Passwort." };

  await db
    .update(users)
    .set({ mfaEnabled: false, mfaMethod: null, totpSecretEncrypted: null })
    .where(eq(users.id, user.id));
  await db.delete(mfaBackupCodes).where(eq(mfaBackupCodes.userId, user.id));
  await logAuditEvent("mfa.disabled", { targetType: "user", targetId: user.id });

  return { success: true };
}

export async function regenerateBackupCodes(): Promise<{ error?: string; backupCodes?: string[] }> {
  if (!(await isTrustedOrigin())) return { error: "Anfrage abgelehnt." };
  const user = await getCurrentUser();
  if (!user) return { error: "Bitte einloggen." };
  if (!user.mfaEnabled) return { error: "2FA ist nicht aktiv." };

  const backupCodes = generateBackupCodes();
  await db.delete(mfaBackupCodes).where(eq(mfaBackupCodes.userId, user.id));
  await db.insert(mfaBackupCodes).values(backupCodes.map((c) => ({ userId: user.id, codeHash: hashCode(c) })));
  await logAuditEvent("mfa.backup_codes_regenerated", { targetType: "user", targetId: user.id });

  return { backupCodes };
}

/**
 * Login-Schritt 2: Code aus der Authenticator-App ODER ein Backup-Code.
 * Liest den kurzlebigen Pending-Token statt sich auf eine vom Client
 * mitgeschickte User-ID zu verlassen - sonst könnte jemand einfach eine
 * fremde ID einsetzen und deren MFA-Code raten.
 */
export async function verifyMfaLogin(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  if (!(await isTrustedOrigin())) return { error: "Anfrage abgelehnt." };

  const cookieStore = await cookies();
  const pendingToken = cookieStore.get(MFA_PENDING_COOKIE)?.value;
  if (!pendingToken) return { error: "Login-Sitzung abgelaufen. Bitte erneut einloggen." };

  const userId = verifyMfaPendingToken(pendingToken);
  if (!userId) return { error: "Login-Sitzung abgelaufen. Bitte erneut einloggen." };

  const rateLimit = await checkMfaVerifyRateLimit(userId);
  if (!rateLimit.success) {
    return { error: `Zu viele Versuche - bitte in ${Math.ceil(rateLimit.resetAfter / 1000 / 60)} Minuten erneut versuchen.` };
  }

  const codeRaw = ((formData.get("code") as string) ?? "").trim();
  if (!codeRaw) return { error: "Bitte einen Code eingeben." };

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || !user.mfaEnabled) return { error: "2FA ist für diesen Account nicht aktiv." };

  let valid = false;

  if (/^\d{6}$/.test(codeRaw) && user.totpSecretEncrypted) {
    const secret = decryptSecret(user.totpSecretEncrypted);
    valid = await verifyTotpCode(secret, codeRaw);
  }

  // Falls kein gültiger TOTP-Code: als Backup-Code probieren (Format
  // XXXXX-XXXXX, siehe generateBackupCodes).
  if (!valid) {
    const codeHash = hashCode(codeRaw.toUpperCase());
    const backupRows = await db
      .select()
      .from(mfaBackupCodes)
      .where(and(eq(mfaBackupCodes.userId, userId), eq(mfaBackupCodes.codeHash, codeHash), isNull(mfaBackupCodes.usedAt)));
    if (backupRows.length > 0) {
      valid = true;
      await db.update(mfaBackupCodes).set({ usedAt: new Date() }).where(eq(mfaBackupCodes.id, backupRows[0].id));
      await logAuditEvent("mfa.backup_code_used", { targetType: "user", targetId: userId });
    }
  }

  if (!valid) return { error: "Code ungültig." };

  // Echte Session erst jetzt, nach bestandener 2FA.
  const token = createSessionToken(user.id, user.email, user.sessionVersion ?? 0);
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  cookieStore.delete(MFA_PENDING_COOKIE);

  return { success: true };
}
