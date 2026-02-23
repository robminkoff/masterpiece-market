import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { listSoloRuns, createSoloRun, getActiveRun } from "@/lib/solo-db";
import { buildSoloConfig, weekRng, TAG_POOL } from "@/lib/solo-engine";
import type { SimArtwork } from "@/lib/solo-engine";

export const dynamic = "force-dynamic";

// GET /api/solo/runs — list user's runs
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const runs = await listSoloRuns(userId);
  return NextResponse.json({ runs });
}

// POST /api/solo/runs — create a new run
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check for existing active run
  const active = await getActiveRun(userId);
  if (active) {
    return NextResponse.json(
      { error: "You already have an active solo run. Finish or abandon it first.", activeRunId: active.id },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const configKey = (body.configKey as string) || "default";
  const cfg = buildSoloConfig(configKey);

  const seed = Math.floor(Math.random() * 2147483647);
  const id = `solo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Generate starting artwork if enabled
  const artworks: SimArtwork[] = [];
  if (cfg.startingArtwork.enabled) {
    const rng = weekRng(seed, 0);
    const tier = cfg.startingArtwork.tier;
    const tc = cfg.tiers[tier];
    const iv = rng.uniformInt(tc.minIV, tc.maxIV);
    const tags = rng.pick(TAG_POOL, rng.uniformInt(1, 2));
    artworks.push({
      iv,
      tier,
      tags,
      idleWeeks: 0,
      onLoan: false,
      loanWeeksRemaining: 0,
      acquiredWeek: 0,
      purchaseCost: 0,
      mortgaged: false,
      mortgagePrincipal: 0,
      mortgageWeeksRemaining: 0,
    });
  }

  const run = await createSoloRun({
    id,
    userId,
    seed,
    configKey,
    cash: cfg.startingCredits,
    artworks,
  });

  return NextResponse.json({ run });
}
