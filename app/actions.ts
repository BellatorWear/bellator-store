"use server";

import { db } from "@/db";
import {
  accessKeys,
  accessRequests,
  users,
  emailVerifications,
  newsletter,
  orders,
  challenges,
  userChallenges,
  pointTransactions,
  rewards,
  userRewards,
  cartItems,
  usernameHistory,
  preReleaseCodes,
  preReleaseRedemptions,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sanitizeText, isSuspiciousInput } from "./utils/inputSafety";
import { USERNAME_RE, daysUntilUsernameChangeAllowed } from "./utils/username";
import { isTrustedOrigin } from "./utils/origin";
import { Resend } from "resend";
import { cookies } from "next/headers";
import { checkLoginRateLimit, checkEmailRateLimit } from "./utils/ratelimit";
import { createSingleUseStripeCode } from "./utils/stripeCodes";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/session";

type ActionResponse = {
  success?: string | boolean;
  error?: string;
  retryAfter?: number;
  mustSetPassword?: boolean;
  email?: string;
  guestName?: string;
  code?: string | null;
  message?: string;
};

// Liest die aktuell eingeloggte, verifizierte Session aus dem Cookie.
// Wird von setPassword/changePassword/logout genutzt, damit niemand die
// Identität einfach per Formularfeld vorgeben kann.
async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

async function setSessionCookie(userId: number, email: string, sessionVersion: number) {
  const cookieStore = await cookies();
  const token = createSessionToken(userId, email, sessionVersion);
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

// Für Server Components (z.B. Profilseite), um den eingeloggten User sicher
// anhand der signierten Session zu laden — niemals anhand von Client-Input.
export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId));
  if (result.length === 0) return null;
  const user = result[0];

  // Session-Invalidierung: Token trägt einen alten Versionsstand (z.B.
  // nach Passwortänderung auf einem anderen Gerät, oder weil der Account
  // zwischenzeitlich gesperrt wurde) -> nicht mehr gültig, obwohl die
  // Signatur technisch noch stimmt und das Ablaufdatum noch nicht erreicht ist.
  if (session.sessionVersion !== (user.sessionVersion ?? 0)) return null;

  // Passwort-Hash niemals an den Client geben
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    points: user.points ?? 0,
    theme: user.theme ?? "dark",
    isAdmin: user.isAdmin ?? false,
    role: user.role ?? null,
    discountPercent: user.discountPercent ?? 0,
    orderCount: user.orderCount ?? 0,
    pushEnabled: user.pushEnabled ?? false,
    newsletterOptIn: user.newsletterOptIn ?? false,
    username: user.username ?? null,
    usernameChangedAt: user.usernameChangedAt ?? null,
    // null = Rollen-Standard erben (siehe app/admin/permissions.ts::hasChatAccess)
    chatAccess: user.chatAccess ?? null,
    // Fail-safe: bei NULL (z.B. alte Zeilen ohne NOT NULL Constraint)
    // lieber einmal zu viel zum Passwort-Setzen auffordern als einen
    // Account ganz ohne Passwort durchrutschen zu lassen.
    mustSetPassword: user.mustSetPassword ?? true,
  };
}

// Schreibt eine Challenge als abgeschlossen gut und gibt die gewonnenen
// Punkte zurück — aber nur, wenn sie noch nicht abgeschlossen wurde.
// Wird sowohl von automatisch erkannten Challenges (Newsletter, Push, Theme)
// als auch vom manuellen "Erledigt"-Button genutzt.
export async function awardChallengeByType(userId: number, type: string) {
  const found = await db
    .select()
    .from(challenges)
    .where(and(eq(challenges.type, type), eq(challenges.active, true)));
  if (found.length === 0) return null;
  const challenge = found[0];

  const already = await db
    .select()
    .from(userChallenges)
    .where(
      and(
        eq(userChallenges.userId, userId),
        eq(userChallenges.challengeId, challenge.id),
      ),
    );
  if (already.length > 0) return null; // schon erledigt

  await db.insert(userChallenges).values({ userId, challengeId: challenge.id });
  await db
    .update(users)
    .set({ points: (await getPoints(userId)) + challenge.pointReward })
    .where(eq(users.id, userId));
  await db.insert(pointTransactions).values({
    userId,
    points: challenge.pointReward,
    reason: `Challenge: ${challenge.title}`,
  });

  return challenge.pointReward;
}

async function getPoints(userId: number): Promise<number> {
  const result = await db.select().from(users).where(eq(users.id, userId));
  return result[0]?.points ?? 0;
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Zufälligen Access Key generieren (10 Zeichen: Buchstaben + Zahlen + Sonderzeichen)
function generateAccessKey(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  let key = "";
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    key += chars[bytes[i] % chars.length];
  }
  return key;
}

// Sicheren Token generieren
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function handleAction(
  formData: FormData,
): Promise<ActionResponse> {
  const actionType = formData.get("actionType") as string;

  // Quelle prüfen, bevor IRGENDEINE Aktion ausgeführt wird - schützt alle
  // state-ändernden Server Actions zentral statt einzeln (war vorher als
  // Utility nur gebaut aber nirgendwo tatsächlich verdrahtet).
  if (!(await isTrustedOrigin())) {
    console.warn(`Blockierte Action von untrusted Origin: ${actionType}`);
    return { error: "Anfrage von nicht vertrauenswürdiger Quelle abgelehnt." };
  }

  // --- LOGIN MIT EMAIL + PASSWORT ---
  if (actionType === "login") {
    const rateLimit = await checkLoginRateLimit();
    if (!rateLimit.success) {
      return {
        error: `Zu viele Versuche. Bitte in ${Math.ceil(rateLimit.resetAfter / 1000 / 60)} Minuten erneut versuchen.`,
        retryAfter: rateLimit.resetAfter,
      };
    }

    const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!email || !password)
      return { error: "Email und Passwort erforderlich." };
    if (email.length > 254 || password.length > 200)
      return { error: "Ungültige Eingabe." };

    const result = await db.select().from(users).where(eq(users.email, email));
    if (result.length === 0) return { error: "Ungültige Anmeldedaten." };

    const user = result[0];

    if (!user.emailVerified) return { error: "Email noch nicht bestätigt." };
    if (!user.passwordHash)
      return { error: "Bitte erst Passwort über den Magic Link setzen." };

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return { error: "Ungültige Anmeldedaten." };

    if (user.pendingDeletionAt && new Date(user.pendingDeletionAt) > new Date()) {
      return {
        error:
          "Dieser Account ist derzeit gesperrt (ausstehende Löschanfrage). Bei Einwand bitte an kontakt@mz-dev.de wenden.",
      };
    }

    await setSessionCookie(user.id, user.email, user.sessionVersion ?? 0);

    // Merken ob User noch Passwort setzen muss (sollte hier nicht der Fall sein, aber sicher ist sicher)
    if (user.mustSetPassword) {
      return { success: true, mustSetPassword: true, email: user.email };
    }

    return { success: true };
  }

  // --- ACCESS KEY LOGIN ---
  if (actionType === "loginWithKey") {
    const rateLimit = await checkLoginRateLimit();
    if (!rateLimit.success) {
      return { error: "Zu viele Versuche.", retryAfter: rateLimit.resetAfter };
    }

    const key = formData.get("accessKey") as string;
    if (!key || key.trim().length === 0) return { error: "Ungültige Eingabe" };

    const result = await db
      .select()
      .from(accessKeys)
      .where(eq(accessKeys.key, key.trim()));
    if (result.length === 0) return { error: "Ungültiger Access Key." };

    const accessKey = result[0];

    // Vorher fehlte diese Prüfung komplett: ein einmal versendeter Key
    // konnte unbegrenzt oft wiederverwendet werden, auch nachdem er als
    // "isUsed" markiert wurde.
    if (accessKey.isUsed) {
      return {
        error:
          "Dieser Access Key wurde bereits verwendet. Bitte mit Email & Passwort einloggen oder einen neuen Zugang anfordern.",
      };
    }
    if (accessKey.expiresAt && new Date() > accessKey.expiresAt) {
      return {
        error:
          "Dieser Access Key ist abgelaufen. Bitte fordere einen neuen an.",
      };
    }
    if (!accessKey.userId || !accessKey.email) {
      return { error: "Access Key ist keinem Account zugeordnet." };
    }

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, accessKey.userId));
    if (userResult.length === 0) return { error: "Account nicht gefunden." };
    const user = userResult[0];

    if (user.pendingDeletionAt && new Date(user.pendingDeletionAt) > new Date()) {
      return {
        error:
          "Dieser Account ist derzeit gesperrt (ausstehende Löschanfrage). Bei Einwand bitte an kontakt@mz-dev.de wenden.",
      };
    }

    // Key als benutzt markieren (nicht löschen, für Audit Trail)
    await db
      .update(accessKeys)
      .set({ isUsed: true })
      .where(eq(accessKeys.id, accessKey.id));

    // Der Key kam per Email an genau diese Adresse — Besitz des Keys
    // bestätigt also auch den Email-Zugriff.
    if (!user.emailVerified) {
      await db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, user.id));
    }

    await setSessionCookie(user.id, user.email, user.sessionVersion ?? 0);

    return {
      success: true,
      mustSetPassword: user.mustSetPassword ?? true,
      email: user.email,
    };
  }

  // --- EMAIL BESTÄTIGUNG ANFORDERN (Magic Link) ---
  if (actionType === "request") {
    const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();

    if (!email || typeof email !== "string")
      return { error: "Ungültige Eingabe" };
    if (email.length > 254) return { error: "Ungültige E-Mail Adresse" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { error: "Ungültige E-Mail Adresse" };

    const rateLimit = await checkEmailRateLimit(email);
    if (!rateLimit.success) {
      return {
        error:
          "Zu viele Anfragen für diese E-Mail. Bitte später erneut versuchen.",
        retryAfter: rateLimit.resetAfter,
      };
    }

    if (!resend) return { error: "E-Mail Dienst nicht konfiguriert." };

    try {
      // Token erstellen (15 Minuten gültig)
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Alten Token löschen falls vorhanden
      await db
        .delete(emailVerifications)
        .where(eq(emailVerifications.email, email));

      // Neuen Token speichern
      await db.insert(emailVerifications).values({ email, token, expiresAt });

      // Access Key schon generieren und speichern (wird in der Email angezeigt)
      const accessKey = generateAccessKey();

      // User anlegen falls nicht vorhanden. Atomarer Upsert statt
      // "select, dann insert falls leer" - bei zwei gleichzeitigen
      // Anfragen (Doppelklick, zwei Tabs) konnten vorher beide die
      // Existenzprüfung passieren, bevor die erste INSERT fertig war,
      // wodurch zwei User-Zeilen mit derselben Email entstanden.
      await db.insert(users).values({ email }).onConflictDoNothing({ target: users.email });
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      if (existingUser.length === 0) {
        return { error: "Account konnte nicht angelegt werden. Bitte nochmal versuchen." };
      }
      const userId = existingUser[0].id;

      // Access Key in DB speichern (läuft nach 7 Tagen automatisch ab)
      const accessKeyExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(accessKeys).values({
        key: accessKey,
        email,
        userId,
        expiresAt: accessKeyExpiresAt,
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mz-dev.de";
      const magicLink = `${baseUrl}/verify?token=${token}`;

      await resend.emails.send({
        from: "Bellator <noreply@mz-dev.de>",
        to: email,
        subject: "Bellator Store — Bestätige deine Email",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Courier New', monospace; background: #000; color: #e0e0e0; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .header { border-bottom: 3px solid white; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { margin: 0; font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: white; }
                .content { line-height: 1.6; color: #e0e0e0; }
                .content p { margin: 15px 0; }
                .key-box { background: #111; padding: 20px; border: 1px solid #333; margin: 20px 0; text-align: center; }
                .key-box .key { font-size: 22px; font-weight: bold; letter-spacing: 0.2em; color: white; font-family: monospace; }
                .cta { display: inline-block; background: white; color: black !important; padding: 14px 32px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin: 20px 0; font-family: 'Courier New', monospace; }
                .divider { border: none; border-top: 1px solid #333; margin: 30px 0; }
                .footer { margin-top: 40px; padding-top: 20px; font-size: 11px; color: #555; border-top: 1px solid #222; }
                .note { font-size: 11px; color: #666; margin-top: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>BELLATOR.</h1>
                </div>
                <div class="content">
                  <p>Hey,</p>
                  <p>du hast Zugang zum Bellator Store angefordert. Klick auf den Button unten, um deine Email zu bestätigen und direkt in den Shop zu kommen.</p>
                  
                  <p style="text-align:center; margin: 30px 0;">
                    <a href="${magicLink}" class="cta">✓ EMAIL BESTÄTIGEN & EINLOGGEN</a>
                  </p>
                  
                  <p class="note">⏱ Dieser Link ist 15 Minuten gültig.</p>

                  <hr class="divider">

                  <p><strong>Alternativ:</strong> Du kannst auch deinen persönlichen Access Key manuell eingeben:</p>
                  
                  <div class="key-box">
                    <p style="margin:0 0 8px 0; font-size:11px; text-transform:uppercase; color:#888; letter-spacing:0.1em;">Dein Access Key</p>
                    <div class="key">${accessKey}</div>
                    <p style="margin:10px 0 0 0; font-size:11px; color:#666;">Kopiere diesen Key und gib ihn auf der Login-Seite ein.</p>
                  </div>

                  <p style="margin-top: 30px; font-size: 12px; color: #888;">Nach dem ersten Login wirst du aufgefordert, ein Passwort zu setzen.</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Bellator Streetwear. Alle Rechte vorbehalten.</p>
                  <p>Diese Email wurde an ${email} gesendet. Wenn du keinen Zugang angefordert hast, ignoriere diese Email.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      // Access Request in DB loggen
      await db.insert(accessRequests).values({ email, status: "pending" });

      return {
        success:
          "Bestätigungs-Email wurde versendet! Bitte prüfe dein Postfach.",
      };
    } catch (e) {
      console.error("Fehler:", e);
      return { error: "Fehler beim Senden der Email." };
    }
  }

  // --- PASSWORT SETZEN (nach Magic Link / Access Key) ---
  if (actionType === "setPassword") {
    const session = await getCurrentSession();
    if (!session) {
      return {
        error: "Sitzung abgelaufen. Bitte erneut einloggen.",
      };
    }

    // Dieser Weg ist NUR für das allererste Setzen des Passworts gedacht.
    // Vorher konnte man darüber jederzeit das Passwort überschreiben, ohne
    // das alte zu kennen - das ist jetzt zu (für eine Änderung gibt es
    // "changePassword" in den Profileinstellungen, das das aktuelle
    // Passwort verlangt).
    const existingResult = await db
      .select({ mustSetPassword: users.mustSetPassword, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.userId));
    const existing = existingResult[0];
    if (existing && existing.passwordHash && existing.mustSetPassword === false) {
      return { error: "Passwort bereits gesetzt. Bitte über die Profileinstellungen ändern." };
    }

    const password = formData.get("password") as string;
    if (!password) return { error: "Ungültige Eingabe." };
    if (password.length < 8)
      return { error: "Passwort muss mindestens 8 Zeichen haben." };
    if (password.length > 72)
      return { error: "Passwort darf höchstens 72 Zeichen lang sein." };

    const passwordHash = await bcrypt.hash(password, 12);

    await db
      .update(users)
      .set({ passwordHash, mustSetPassword: false })
      .where(eq(users.id, session.userId));

    // "Unter den ersten 100" Challenge - nutzt die User-ID als Beitritts-
    // Reihenfolge (serial, fortlaufend vergeben).
    if (session.userId <= 100) {
      await awardChallengeByType(session.userId, "first_100");
    }
    // "Profil vervollständigen" (Email bestätigt + Passwort gesetzt) - vorher
    // hat das nie etwas getriggert, die Challenge war unerreichbar.
    await awardChallengeByType(session.userId, "complete_profile");

    return { success: true };
  }

  // --- PASSWORT ÄNDERN (im eingeloggten Zustand, z.B. Profilseite) ---
  if (actionType === "changePassword") {
    const session = await getCurrentSession();
    if (!session) {
      return { error: "Sitzung abgelaufen. Bitte erneut einloggen." };
    }

    const rateLimit = await checkLoginRateLimit();
    if (!rateLimit.success) {
      return { error: "Zu viele Versuche.", retryAfter: rateLimit.resetAfter };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    if (!currentPassword || !newPassword)
      return { error: "Bitte alle Felder ausfüllen." };
    if (newPassword.length < 8)
      return { error: "Neues Passwort muss mindestens 8 Zeichen haben." };
    if (newPassword.length > 72)
      return { error: "Neues Passwort darf höchstens 72 Zeichen lang sein." };

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));
    if (result.length === 0) return { error: "Account nicht gefunden." };
    const user = result[0];

    if (!user.passwordHash) {
      return { error: "Für diesen Account ist noch kein Passwort gesetzt." };
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return { error: "Aktuelles Passwort ist falsch." };

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const newSessionVersion = (user.sessionVersion ?? 0) + 1;
    await db.update(users).set({ passwordHash, sessionVersion: newSessionVersion }).where(eq(users.id, user.id));

    // Alte Sessions (andere Geräte/Browser) werden durch den erhöhten
    // Versionszähler sofort ungültig. Dieses Gerät bekommt direkt ein
    // frisches Token mit dem neuen Stand, bleibt also eingeloggt.
    await setSessionCookie(user.id, user.email, newSessionVersion);

    return { success: "Passwort wurde geändert." };
  }

  // --- LOGOUT ---
  if (actionType === "logout") {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { success: true };
  }

  // --- WARENKORB ---
  // (Der alte cookie-basierte "addToCart"-Stub wurde entfernt - der echte,
  // DB-gestützte Warenkorb lebt jetzt in app/cart.ts)

  // --- PASSWORT VERIFIZIEREN (für Belege-Seite) ---
  if (actionType === "verifyPassword") {
    const session = await getCurrentSession();
    if (!session) return { error: "Nicht eingeloggt." };

    const password = formData.get("password") as string;
    if (!password) return { error: "Passwort erforderlich." };

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));
    if (result.length === 0) return { error: "Account nicht gefunden." };

    const user = result[0];
    if (!user.passwordHash) return { error: "Kein Passwort gesetzt." };

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return { error: "Falsches Passwort." };

    return { success: true };
  }

  // --- GAST LOGIN ---
  if (actionType === "guestLogin") {
    const cookieStore = await cookies();
    cookieStore.set("bellator-guest", "true", {
      maxAge: 60 * 60 * 24, // 1 Tag
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    });

    // "Gast" + 4-6 zufällige Ziffern, damit man Gäste klar voneinander
    // unterscheiden kann (z.B. im Warenkorb/Bestellungen). Nicht
    // sicherheitsrelevant, daher kein httpOnly nötig — aber trotzdem über
    // den Server gesetzt, damit es nicht vom Client manipuliert werden kann.
    const digitCount = 4 + Math.floor(Math.random() * 3); // 4,5 oder 6
    const max = 10 ** digitCount;
    const randomDigits = crypto.randomInt(0, max).toString().padStart(digitCount, "0");
    const guestName = `Gast${randomDigits}`;
    cookieStore.set("bellator-guest-name", guestName, {
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    });

    return { success: true, guestName };
  }

  // --- ACCOUNT LÖSCHEN ---
  if (actionType === "deleteAccount") {
    const session = await getCurrentSession();
    if (!session) return { error: "Nicht eingeloggt." };

    // Alle zugehörigen Daten löschen (DSGVO Art. 17 "Recht auf Löschung").
    // Ausnahme: Bestellungen (orders) werden NICHT gelöscht, weil dafür in
    // Deutschland eine gesetzliche Aufbewahrungspflicht von 10 Jahren gilt
    // (§ 147 AO / § 257 HGB, Rechnungs-/Buchhaltungsunterlagen). Das ist
    // eine bewusste Entscheidung, kein Versehen.
    await db.delete(cartItems).where(eq(cartItems.ownerKey, `user:${session.userId}`));
    await db.delete(userChallenges).where(eq(userChallenges.userId, session.userId));
    await db.delete(pointTransactions).where(eq(pointTransactions.userId, session.userId));
    await db.delete(userRewards).where(eq(userRewards.userId, session.userId));
    await db.delete(newsletter).where(eq(newsletter.email, session.email));
    await db
      .delete(emailVerifications)
      .where(eq(emailVerifications.email, session.email));
    await db.delete(accessKeys).where(eq(accessKeys.userId, session.userId));
    await db.delete(users).where(eq(users.id, session.userId));

    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { success: true };
  }

  // --- THEME SETZEN ---
  if (actionType === "setTheme") {
    const session = await getCurrentSession();
    if (!session) return { error: "Nicht eingeloggt." };
    const theme = formData.get("theme") as string;
    if (theme !== "dark" && theme !== "light")
      return { error: "Ungültiges Theme." };
    await db.update(users).set({ theme }).where(eq(users.id, session.userId));
    if (theme === "light") {
      await awardChallengeByType(session.userId, "theme_explorer");
    }
    // Theme-Cookie setzen damit es beim Seitenaufruf sofort verfügbar ist
    const cookieStore = await cookies();
    cookieStore.set("bellator-theme", theme, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false, // Muss vom JS lesbar sein
      path: "/",
      sameSite: "strict",
    });
    return { success: true };
  }

  // --- NEWSLETTER ANMELDEN/ABMELDEN (Popup + Einstellungen) ---
  if (actionType === "toggleNewsletter") {
    const session = await getCurrentSession();
    if (!session) return { error: "Nicht eingeloggt." };

    const enable = formData.get("enable") === "true";

    await db
      .update(users)
      .set({ newsletterOptIn: enable })
      .where(eq(users.id, session.userId));

    try {
      if (enable) {
        await db
          .insert(newsletter)
          .values({ email: session.email })
          .onConflictDoUpdate({
            target: newsletter.email,
            set: { active: true },
          });
        await awardChallengeByType(session.userId, "newsletter");
      } else {
        await db
          .update(newsletter)
          .set({ active: false })
          .where(eq(newsletter.email, session.email));
      }
    } catch (e) {
      console.error("Newsletter-Fehler:", e);
    }

    return { success: true };
  }

  // Alter Name bleibt erhalten für das Sold-Out-Formular auf der Shop-Seite,
  // das auch von Gästen (ohne Account) genutzt werden kann.
  if (actionType === "subscribeNewsletter") {
    const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
    if (!email) return { error: "Email erforderlich." };
    try {
      await db.insert(newsletter).values({ email }).onConflictDoNothing();
    } catch {
      return { error: "Fehler beim Eintragen." };
    }
    return { success: "Eingetragen!" };
  }

  // --- PUSH AKTIVIEREN/DEAKTIVIEREN ---
  if (actionType === "togglePush") {
    const session = await getCurrentSession();
    if (!session) return { error: "Nicht eingeloggt." };

    const enable = formData.get("enable") === "true";
    const subscriptionRaw = formData.get("subscription") as string | null;

    await db
      .update(users)
      .set({
        pushEnabled: enable,
        pushSubscription: enable ? (subscriptionRaw ?? null) : null,
      })
      .where(eq(users.id, session.userId));

    if (enable) {
      await awardChallengeByType(session.userId, "push");
    }

    return { success: true };
  }

  // --- CHALLENGE MANUELL ALS ERLEDIGT MARKIEREN ---
  // Nur für Challenges, die wir nicht automatisch verifizieren können
  // (z.B. "Discord beitreten" — wir haben keinen Bot, der das prüft).
  if (actionType === "completeChallenge") {
    const session = await getCurrentSession();
    if (!session) return { error: "Nicht eingeloggt." };

    const challengeId = Number(formData.get("challengeId"));
    if (!challengeId) return { error: "Ungültige Challenge." };

    const SELF_REPORT_TYPES = ["discord_join", "review", "referral"];

    const found = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId));
    if (found.length === 0) return { error: "Challenge nicht gefunden." };
    const challenge = found[0];

    if (!SELF_REPORT_TYPES.includes(challenge.type)) {
      return { error: "Diese Challenge wird automatisch erkannt." };
    }

    const already = await db
      .select()
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.userId, session.userId),
          eq(userChallenges.challengeId, challenge.id),
        ),
      );
    if (already.length > 0) return { error: "Challenge bereits erledigt." };

    const awarded = await awardChallengeByType(session.userId, challenge.type);
    if (!awarded) return { error: "Challenge bereits erledigt." };

    return { success: `+${awarded} Punkte erhalten!` };
  }

  // --- PRÄMIE MIT PUNKTEN EINLÖSEN (kein echtes Geld) ---
  if (actionType === "redeemReward") {
    const session = await getCurrentSession();
    if (!session) return { error: "Nicht eingeloggt." };

    const rewardId = Number(formData.get("rewardId"));
    if (!rewardId) return { error: "Ungültige Prämie." };

    const rewardResult = await db
      .select()
      .from(rewards)
      .where(eq(rewards.id, rewardId));
    if (rewardResult.length === 0 || !rewardResult[0].active) {
      return { error: "Prämie nicht verfügbar." };
    }
    const reward = rewardResult[0];

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));
    if (userResult.length === 0) return { error: "Account nicht gefunden." };
    const user = userResult[0];
    const currentPoints = user.points ?? 0;

    if (currentPoints < reward.costPoints) {
      return { error: "Nicht genug Punkte." };
    }

    // Punkte abziehen
    await db
      .update(users)
      .set({ points: currentPoints - reward.costPoints })
      .where(eq(users.id, session.userId));
    await db.insert(pointTransactions).values({
      userId: session.userId,
      points: -reward.costPoints,
      reason: `Prämie: ${reward.title}`,
    });

    // Effekt je nach Prämien-Typ anwenden
    let code: string | null = null;
    if (reward.type === "discount") {
      const percent = reward.discountPercent ?? 5;
      const result = await createSingleUseStripeCode({
        percentOff: percent,
        source: "reward_redemption",
        userId: session.userId,
        expiresInDays: 90,
      });
      if ("error" in result) {
        await db.update(users).set({ points: currentPoints }).where(eq(users.id, session.userId));
        await db.insert(pointTransactions).values({
          userId: session.userId,
          points: reward.costPoints,
          reason: `Rückerstattung: ${reward.title} (Fehler bei Code-Erstellung)`,
        });
        return { error: result.error };
      }
      code = result.code;
    } else if (reward.type === "prerelease_access") {
      // Früher Zugang: einen neuen Pre-Release-Code speziell für diesen
      // User erstellen (max 1 Einlösung), sodass er Pre-Release-Produkte
      // sehen kann ohne einen öffentlichen Code zu kennen.
      const userCode = "VIP-" + crypto.randomBytes(5).toString("hex").toUpperCase();
      await db.insert(preReleaseCodes).values({
        code: userCode,
        maxUsesPerAccount: 1,
      });
      // Sofort für diesen User einlösen
      const newPrc = await db
        .select()
        .from(preReleaseCodes)
        .where(eq(preReleaseCodes.code, userCode));
      if (newPrc.length > 0) {
        await db.insert(preReleaseRedemptions).values({
          codeId: newPrc[0].id,
          userId: session.userId,
        });
      }
      code = userCode;
    } else if (reward.type === "physical") {
      code = "BLT-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    }

    await db.insert(userRewards).values({
      userId: session.userId,
      rewardId: reward.id,
      code,
    });

    // Code per Email schicken, damit der User ihn auch später noch hat.
    if (code) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Bellator <noreply@mz-dev.de>",
          to: user.email,
          subject: `Dein Bellator Code: ${reward.title}`,
          html: `<!DOCTYPE html><html><body style="font-family:'Courier New',monospace;background:#000;color:#e0e0e0;margin:0;padding:40px 20px;"><h1 style="color:white;font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;border-bottom:2px solid white;padding-bottom:16px;">BELLATOR.</h1><p style="margin-top:24px;">Du hast <strong>${reward.title}</strong> eingelöst.</p><div style="background:#111;border:2px solid white;padding:24px;margin:24px 0;text-align:center;"><p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 12px;">Dein Code</p><p style="font-size:22px;font-weight:900;letter-spacing:0.15em;color:white;margin:0;">${code}</p></div><p style="color:#888;font-size:11px;">Gib diesen Code beim Checkout ein um deinen Rabatt zu erhalten.</p></body></html>`,
        });
      } catch (e) {
        // Email-Fehler darf die Einlösung nicht rückgängig machen -
        // der Code wird im UI trotzdem angezeigt.
        console.error("Reward-Email fehlgeschlagen:", e);
      }
    }

    return {
      success: true,
      code: code ?? null,
      message: reward.title,
    };
  }

  // --- BENUTZERNAME SETZEN/ÄNDERN ---
  if (actionType === "setUsername") {
    const session = await getCurrentSession();
    if (!session) return { error: "Nicht eingeloggt." };

    const raw = (formData.get("username") as string) ?? "";
    const username = sanitizeText(raw, 20);

    if (isSuspiciousInput(raw)) {
      return { error: "Ungültige Eingabe." };
    }
    if (!USERNAME_RE.test(username)) {
      return {
        error: "3-20 Zeichen, nur Buchstaben, Zahlen, Punkt und Unterstrich.",
      };
    }

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));
    if (userResult.length === 0) return { error: "Account nicht gefunden." };
    const current = userResult[0];

    // Cooldown nur bei einer ÄNDERUNG (nicht beim allerersten Setzen)
    if (current.username) {
      const cooldownDays = daysUntilUsernameChangeAllowed(
        current.usernameChangedAt,
      );
      if (cooldownDays > 0) {
        return {
          error: `Du kannst deinen Namen erst in ${cooldownDays} Tag(en) wieder ändern.`,
        };
      }
    }

    // Eindeutigkeit prüfen (case-insensitive wäre noch besser, aber so
    // bleibt es konsistent mit der DB-UNIQUE-Constraint)
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    if (existing.length > 0 && existing[0].id !== session.userId) {
      return { error: "Dieser Benutzername ist schon vergeben." };
    }

    try {
      await db
        .update(users)
        .set({ username, usernameChangedAt: new Date() })
        .where(eq(users.id, session.userId));
      // Jede gesetzte/geänderte Variante landet in der Historie, damit
      // Admins später auch nach alten Namen suchen können.
      await db.insert(usernameHistory).values({ userId: session.userId, username });
    } catch {
      return { error: "Dieser Benutzername ist schon vergeben." };
    }

    return { success: true };
  }

  return { error: "Ungültige Aktion." };
}
