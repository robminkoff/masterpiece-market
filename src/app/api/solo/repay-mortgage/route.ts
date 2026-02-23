import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { getSoloRun, saveSoloRun } from "@/lib/solo-db";

export const dynamic = "force-dynamic";

// POST /api/solo/repay-mortgage — repay a mortgage early
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

  const artwork = run.artworks[artworkIndex];
  if (!artwork) return NextResponse.json({ error: "Artwork not found" }, { status: 400 });
  if (!artwork.mortgaged) return NextResponse.json({ error: "Artwork is not mortgaged" }, { status: 400 });

  if (run.cash < artwork.mortgagePrincipal) {
    return NextResponse.json({ error: "Insufficient credits to repay" }, { status: 400 });
  }

  run.cash -= artwork.mortgagePrincipal;
  artwork.mortgaged = false;
  artwork.mortgagePrincipal = 0;
  artwork.mortgageWeeksRemaining = 0;

  await saveSoloRun(run);
  return NextResponse.json({ run });
}
