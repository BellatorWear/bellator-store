import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailVerifications, users, accessKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

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

  // Auth Cookie setzen
  const cookieStore = await cookies();
  cookieStore.set("bellator-access", "authorized", {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "strict",
  });

  return NextResponse.json({ success: true, email: verification.email });
}
