import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { resetPlayerGame } from "@/lib/db";

// POST /api/reset — reset game to initial seed state for the current player
export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await resetPlayerGame(userId);
  return NextResponse.json({ ok: true });
}
