import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/lib/auth";
import {
  getCredits,
  adjustCredits,
  applyBurnTick,
  getOwnershipsByOwner,
  getArtworks,
} from "@/lib/db";
import { weeklyCarryCost } from "@/lib/types";
import type { ArtworkTier } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/credits — returns current balance, triggers burn tick
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const burn = await applyBurnTick(userId);

  // Calculate current weekly burn
  const [playerOwned, artworks] = await Promise.all([
    getOwnershipsByOwner(userId),
    getArtworks(),
  ]);
  const artworkMap = new Map(artworks.map((a) => [a.id, a]));

  const weeklyBurn = playerOwned.reduce((sum, o) => {
    const art = artworkMap.get(o.artwork_id);
    if (!art) return sum;
    return sum + weeklyCarryCost(art.insured_value, art.tier as ArtworkTier, o.on_loan, o.idle_weeks);
  }, 0);

  const credits = await getCredits(userId);

  return NextResponse.json({
    credits,
    burn,
    weeklyBurn,
  });
}

const ALLOWED_PACKS = [10_000, 25_000, 50_000];

const TopUpSchema = z.object({
  amount: z.number().refine((n) => ALLOWED_PACKS.includes(n), {
    message: `Amount must be one of: ${ALLOWED_PACKS.join(", ")}`,
  }),
});

// POST /api/credits — add credits (top-up)
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = TopUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { amount } = parsed.data;
  const credits = await adjustCredits(userId, +amount, "Credit top-up");

  return NextResponse.json({ credits });
}
