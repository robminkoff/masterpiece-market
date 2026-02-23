import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { getSoloRun, saveSoloRun } from "@/lib/solo-db";
import { buildSoloConfig } from "@/lib/solo-engine";

export const dynamic = "force-dynamic";

// POST /api/solo/sell — sell an artwork to dealer at 50% IV
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { runId, artworkIndex } = body;
  if (!runId || artworkIndex === undefined) {
    return NextResponse.json({ error: "runId and artworkIndex required" }, { status: 400 });
  }

  const run = await getSoloRun(runId, userId);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (run.outcome) return NextResponse.json({ error: "Run already finished" }, { status: 400 });

  const cfg = buildSoloConfig(run.configKey);
  const artwork = run.artworks[artworkIndex];
  if (!artwork) return NextResponse.json({ error: "Artwork not found" }, { status: 400 });
  if (artwork.onLoan) return NextResponse.json({ error: "Cannot sell artwork on loan" }, { status: 400 });
  if (artwork.mortgaged) return NextResponse.json({ error: "Cannot sell mortgaged artwork" }, { status: 400 });

  const proceeds = Math.round(artwork.iv * cfg.fees.dealerBuyRate);
  run.cash += proceeds;
  run.artworks.splice(artworkIndex, 1);

  // Also remove any pending loans for this artwork (indexes shift)
  run.pendingLoans = run.pendingLoans.filter((l) => l.artworkIndex !== artworkIndex)
    .map((l) => ({
      ...l,
      artworkIndex: l.artworkIndex > artworkIndex ? l.artworkIndex - 1 : l.artworkIndex,
    }));

  await saveSoloRun(run);
  return NextResponse.json({ run, proceeds });
}
