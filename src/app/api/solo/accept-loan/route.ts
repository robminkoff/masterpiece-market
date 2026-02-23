import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { getSoloRun, saveSoloRun } from "@/lib/solo-db";
import { buildSoloConfig, calculateGenreBonus } from "@/lib/solo-engine";

export const dynamic = "force-dynamic";

// POST /api/solo/accept-loan — accept a curator loan offer
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { runId, loanIndex } = body;
  if (!runId || loanIndex === undefined) {
    return NextResponse.json({ error: "runId and loanIndex required" }, { status: 400 });
  }

  const run = await getSoloRun(runId, userId);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (run.outcome) return NextResponse.json({ error: "Run already finished" }, { status: 400 });

  const cfg = buildSoloConfig(run.configKey);

  const offer = run.pendingLoans.find((l) => l.index === loanIndex);
  if (!offer) return NextResponse.json({ error: "Loan offer not found" }, { status: 400 });

  const artwork = run.artworks[offer.artworkIndex];
  if (!artwork) return NextResponse.json({ error: "Artwork not found" }, { status: 400 });
  if (artwork.onLoan) return NextResponse.json({ error: "Artwork already on loan" }, { status: 400 });
  if (artwork.mortgaged) return NextResponse.json({ error: "Cannot loan mortgaged artwork" }, { status: 400 });

  // Accept the loan — curator pays fee to player
  run.cash += offer.fee;
  artwork.onLoan = true;
  artwork.loanWeeksRemaining = offer.duration;
  artwork.idleWeeks = 0;

  // Remove this offer from pending
  run.pendingLoans = run.pendingLoans.filter((l) => l.index !== loanIndex);

  // Calculate genre bonus for all loans accepted this week
  const loansThisWeek = run.artworks
    .map((a, i) => ({ artworkIndex: i, fee: 0, onLoan: a.onLoan, acquiredWeek: a.acquiredWeek }))
    .filter((_, i) => {
      const a = run.artworks[i];
      return a.onLoan && a.loanWeeksRemaining > 0;
    });

  // Simple genre bonus: if 2+ works just got loaned, check for shared tags
  const justLoaned = run.artworks
    .map((a, i) => ({ artworkIndex: i, fee: offer.fee }))
    .filter((_, i) => run.artworks[i].onLoan && run.artworks[i].loanWeeksRemaining > 1);

  if (justLoaned.length >= 2) {
    const bonus = calculateGenreBonus(justLoaned, run.artworks, cfg);
    if (bonus > 0) {
      run.cash += bonus;
    }
  }

  await saveSoloRun(run);
  return NextResponse.json({ run, accepted: offer });
}
