import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { getSoloRun, saveSoloRun } from "@/lib/solo-db";
import { buildSoloConfig } from "@/lib/solo-engine";
import type { SimArtwork } from "@/lib/solo-engine";

export const dynamic = "force-dynamic";

// POST /api/solo/buy — buy a lot from pending_lots
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { runId, lotIndex } = body;
  if (!runId || lotIndex === undefined) {
    return NextResponse.json({ error: "runId and lotIndex required" }, { status: 400 });
  }

  const run = await getSoloRun(runId, userId);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (run.outcome) return NextResponse.json({ error: "Run already finished" }, { status: 400 });

  const cfg = buildSoloConfig(run.configKey);

  // Find the lot
  const lot = run.pendingLots.find((l) => l.index === lotIndex);
  if (!lot) return NextResponse.json({ error: "Lot not found or already purchased" }, { status: 400 });

  // Count acquisitions this week (lots already bought)
  const lotsAlreadyBought = run.artworks.filter((a) => a.acquiredWeek === run.week && a.purchaseCost > 0).length;
  if (lotsAlreadyBought >= cfg.maxAcquisitionsPerWeek) {
    return NextResponse.json({ error: `Max ${cfg.maxAcquisitionsPerWeek} acquisitions per week` }, { status: 400 });
  }

  // Check funds
  if (run.cash < lot.totalCost) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
  }

  // Execute purchase
  run.cash -= lot.totalCost;
  const newArtwork: SimArtwork = {
    iv: lot.iv,
    tier: lot.tier,
    tags: lot.tags,
    idleWeeks: 0,
    onLoan: false,
    loanWeeksRemaining: 0,
    acquiredWeek: run.week,
    purchaseCost: lot.totalCost,
    mortgaged: false,
    mortgagePrincipal: 0,
    mortgageWeeksRemaining: 0,
  };
  run.artworks.push(newArtwork);

  // Remove lot from pending
  run.pendingLots = run.pendingLots.filter((l) => l.index !== lotIndex);

  await saveSoloRun(run);
  return NextResponse.json({ run, purchased: newArtwork });
}
