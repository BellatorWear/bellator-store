import { NextResponse } from "next/server";
import { db } from "@/db";
import { pageViews } from "@/db/schema";

export async function POST() {
  try {
    await db.insert(pageViews).values({});
    return NextResponse.json({ ok: true });
  } catch {
    // Fehler ignorieren - Tracking darf die Site nie beeinträchtigen.
    return NextResponse.json({ ok: false });
  }
}
