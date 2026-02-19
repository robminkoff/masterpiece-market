import { NextResponse } from "next/server";
import { resetGame } from "@/data/store";

// POST /api/reset — reset game to initial seed state
export async function POST() {
  resetGame();
  return NextResponse.json({ ok: true });
}
