import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

// Für externe Uptime-Monitore (UptimeRobot, Better Uptime, StatusCake, ...).
// Prüft eine echte, minimale DB-Query statt nur "Server läuft" zu
// bestätigen - ein Server, der antwortet, aber dessen DB down ist, soll
// als "unhealthy" erkannt werden, nicht als "gesund".
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[health] DB-Check fehlgeschlagen:", error);
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
