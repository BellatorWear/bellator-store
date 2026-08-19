import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailVerifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createUserSession } from "@/app/utils/createUserSession";

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

  if (user.pendingDeletionAt && new Date(user.pendingDeletionAt) > new Date()) {
    return NextResponse.json(
      { error: "Dieser Account ist derzeit gesperrt (ausstehende Löschanfrage). Bei Einwand bitte an kontakt@mz-dev.de wenden." },
      { status: 403 },
    );
  }

  // Signierte Session setzen (statt eines unsignierten "authorized"-Strings,
  // der von jedem Browser selbst gesetzt werden konnte)
  await createUserSession(user.id, user.email, user.sessionVersion ?? 0);

  return NextResponse.json({
    success: true,
    email: user.email,
    mustSetPassword: user.mustSetPassword ?? true,
  });
}
