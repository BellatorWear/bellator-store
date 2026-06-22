import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailVerifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token)
    return NextResponse.json({ error: "Kein Token." }, { status: 400 });

  const result = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.token, token));
  if (result.length === 0)
    return NextResponse.json(
      { error: "Token nicht gefunden." },
      { status: 404 },
    );

  const verification = result[0];

  if (verification.used)
    return NextResponse.json(
      { error: "Token bereits verwendet." },
      { status: 400 },
    );
  if (new Date() > verification.expiresAt)
    return NextResponse.json({ error: "Token abgelaufen." }, { status: 400 });

  // Token als benutzt markieren
  await db
    .update(emailVerifications)
    .set({ used: true })
    .where(eq(emailVerifications.token, token));

  // User als verifiziert markieren
  await db
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.email, verification.email));

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, verification.email));
  if (userResult.length === 0) {
    return NextResponse.json({ error: "Account nicht gefunden." }, { status: 404 });
  }
  const user = userResult[0];

  // Signierte Session setzen (statt eines unsignierten "authorized"-Strings,
  // der von jedem Browser selbst gesetzt werden konnte)
  const cookieStore = await cookies();
  const sessionToken = createSessionToken(user.id, user.email);
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());

  return NextResponse.json({
    success: true,
    email: user.email,
    mustSetPassword: user.mustSetPassword ?? false,
  });
}
