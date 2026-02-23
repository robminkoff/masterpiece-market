import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { getSoloRun, saveSoloRun } from "@/lib/solo-db";
import { buildSoloConfig } from "@/lib/solo-engine";

export const dynamic = "force-dynamic";

// POST /api/solo/mortgage — take a mortgage on an artwork
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
  if (!cfg.mortgage.enabled) {
    return NextResponse.json({ error: "Mortgages not enabled" }, { status: 400 });
  }

  const artwork = run.artworks[artworkIndex];
  if (!artwork) return NextResponse.json({ error: "Artwork not found" }, { status: 400 });
  if (artwork.mortgaged) return NextResponse.json({ error: "Artwork already mortgaged" }, { status: 400 });
  if (artwork.onLoan) return NextResponse.json({ error: "Cannot mortgage artwork on loan" }, { status: 400 });

  // Check mortgage limit
  const mortgageCount = run.artworks.filter((a) => a.mortgaged).length;
  if (mortgageCount >= cfg.mortgage.maxMortgages) {
    return NextResponse.json({ error: `Max ${cfg.mortgage.maxMortgages} concurrent mortgages` }, { status: 400 });
  }

  const loanAmount = Math.round(artwork.iv * cfg.mortgage.ltvRate);
  artwork.mortgaged = true;
  artwork.mortgagePrincipal = loanAmount;
  artwork.mortgageWeeksRemaining = cfg.mortgage.termWeeks;
  run.cash += loanAmount;

  await saveSoloRun(run);
  return NextResponse.json({ run, loanAmount });
}
