import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
import {
  getCredits,
  applyBurnTick,
  adjustCredits,
  persistState,
  ownerships,
} from "@/data/store";
import { SEED_ARTWORKS } from "@/data/seed";
import { STUB_USER_ID } from "@/lib/supabase";
import { weeklyCarryCost } from "@/lib/types";
import type { ArtworkTier } from "@/lib/types";

// GET /api/credits — returns current balance, triggers burn tick
export async function GET() {
  const burn = applyBurnTick();
  if (burn.weeksElapsed > 0) {
    persistState();
  }

  // Calculate current weekly burn
  const playerOwned = ownerships.filter(
    (o) => o.owner_id === STUB_USER_ID && o.is_active,
  );
  const weeklyBurn = playerOwned.reduce((sum, o) => {
    const art = SEED_ARTWORKS.find((a) => a.id === o.artwork_id);
    if (!art) return sum;
    return sum + weeklyCarryCost(art.insured_value, art.tier as ArtworkTier, o.on_loan, o.idle_weeks);
  }, 0);

  return NextResponse.json({
    credits: getCredits(),
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
  const body = await request.json();
  const parsed = TopUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { amount } = parsed.data;
  adjustCredits(+amount, "Credit top-up");
  persistState();

  return NextResponse.json({ credits: getCredits() });
}
