"use server";

import { db } from "@/db";
import { accessKeys, accessRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { cookies } from "next/headers";
import { checkLoginRateLimit, checkEmailRateLimit } from "./utils/ratelimit";

type ActionResponse = {
  success?: string | boolean;
  error?: string;
  retryAfter?: number; // In Millisekunden
};

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function handleAction(
  formData: FormData,
): Promise<ActionResponse> {
  const actionType = formData.get("actionType") as string;

  // --- LOGIN LOGIK ---
  if (actionType === "login") {
    // Rate Limit Check
    const rateLimit = await checkLoginRateLimit();
    if (!rateLimit.success) {
      return {
        error: `Zu viele Versuche. Bitte versuche es in ${Math.ceil(rateLimit.resetAfter / 1000 / 60)} Minuten erneut.`,
        retryAfter: rateLimit.resetAfter,
      };
    }

    const key = formData.get("accessKey") as string;

    // Input Validation
    if (!key || typeof key !== "string" || key.trim().length === 0) {
      return { error: "Ungültige Eingabe" };
    }

    if (key.length > 256) {
      return { error: "Eingabe zu lang" };
    }

    const result = await db
      .select()
      .from(accessKeys)
      .where(eq(accessKeys.key, key));

    if (result.length > 0) {
      await db.delete(accessKeys).where(eq(accessKeys.key, key));

      // Cookie setzen für den Zugriffsschutz
      const cookieStore = await cookies();
      cookieStore.set("bellator-access", "authorized", {
        maxAge: 60 * 60 * 24 * 7, // 7 Tage gültig
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict", // CSRF Protection
      });

      return { success: true };
    }

    return { error: "Invalid Access Key" };
  }

  // --- REQUEST LOGIK ---
  if (actionType === "request") {
    const email = formData.get("email") as string;

    // Input Validation
    if (!email || typeof email !== "string") {
      return { error: "Ungültige Eingabe" };
    }

    // Email Validation (einfach)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: "Ungültige E-Mail Adresse" };
    }

    // Rate Limit Check für Email
    const rateLimit = await checkEmailRateLimit(email);
    if (!rateLimit.success) {
      return {
        error: `Zu viele Anfragen für diese E-Mail. Versuche es später erneut.`,
        retryAfter: rateLimit.resetAfter,
      };
    }

    if (!resend) {
      return { error: "E-Mail Dienst nicht konfiguriert." };
    }

    try {
      const emailResponse = await resend.emails.send({
        from: "Bellator <onboarding@resend.dev>",
        to: email,
        subject: "Dein Zugang zum Bellator Store - Anfrage erhalten",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Courier New', monospace; background: #000; color: #e0e0e0; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .header { border-bottom: 3px solid white; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { margin: 0; font-size: 32px; font-weight: black; text-transform: uppercase; letter-spacing: 0.15em; }
                .content { line-height: 1.6; }
                .content p { margin: 15px 0; }
                .highlight { background: #111; padding: 20px; border-left: 4px solid white; margin: 20px 0; }
                .footer { border-top: 1px solid #333; margin-top: 40px; padding-top: 20px; font-size: 12px; color: #666; }
                .cta { display: inline-block; background: white; color: black; padding: 12px 24px; text-decoration: none; font-weight: bold; text-transform: uppercase; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>BELLATOR.</h1>
                </div>
                
                <div class="content">
                  <p>Hey!</p>
                  <p>Deine Anfrage für den Bellator Store wurde erhalten.</p>
                  
                  <div class="highlight">
                    <p><strong>Was jetzt?</strong></p>
                    <p>Wir prüfen deine Anfrage und melden uns bald bei dir mit deinem Zugang.</p>
                  </div>
                  
                  <p>Danke, dass du Teil der Bellator Community werden möchtest. 🛒</p>
                  
                  <p style="margin-top: 40px;">
                    <strong>240g Heavy Cotton. Oversized Fit. Ohne Kompromisse.</strong>
                  </p>
                </div>
                
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Bellator Streetwear. Alle Rechte vorbehalten.</p>
                  <p>Diese Email wurde an ${email} gesendet.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (emailResponse.error) {
        console.error("Resend Email Error:", emailResponse.error);
        return {
          error: `Email konnte nicht versendet werden: ${emailResponse.error.message || "Unbekannter Fehler"}`,
        };
      }

      // NUR wenn Email erfolgreich: dann in DB speichern
      await db.insert(accessRequests).values({
        email: email,
        status: "pending",
      });

      return {
        success: "Anfrage erhalten! Eine Bestätigungs-Email wurde versendet.",
      };
    } catch (e) {
      console.error("Fehler beim Request:", e);
      if (e instanceof Error) {
        return { error: `Fehler: ${e.message}` };
      }
      return { error: "Fehler beim Speichern oder Senden." };
    }
  }

  // --- WARENKORB LOGIK ---
  if (actionType === "addToCart") {
    const productId = formData.get("productId") as string;
    const cookieStore = await cookies();
    const cart = cookieStore.get("cart")?.value;
    const cartItems = cart ? JSON.parse(cart) : [];

    cartItems.push(productId);

    cookieStore.set("cart", JSON.stringify(cartItems), {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
    });

    return { success: true };
  }

  return { error: "Ungültige Aktion." };
}
