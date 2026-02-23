import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { getSoloRun, saveSoloRun } from "@/lib/solo-db";
import { buildSoloConfig, checkMuseum, executeAscension } from "@/lib/solo-engine";

export const dynamic = "force-dynamic";

// POST /api/solo/found-museum — found museum + ascend within the run
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { runId } = body;
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  const run = await getSoloRun(runId, userId);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (run.outcome) return NextResponse.json({ error: "Run already finished" }, { status: 400 });

  const cfg = buildSoloConfig(run.configKey);

  if (!checkMuseum(run.cash, run.artworks, run.expertise, cfg)) {
    return NextResponse.json({ error: "Museum requirements not met" }, { status: 400 });
  }

  // Execute ascension
  const state = {
    cash: run.cash,
    artworks: run.artworks,
    museumsFounded: run.museumsFounded,
    seed: run.seed,
    week: run.week,
  };
  executeAscension(state, cfg);

  run.cash = state.cash;
  run.artworks = state.artworks;
  run.museumsFounded = state.museumsFounded;
  run.pendingLots = [];
  run.pendingLoans = [];
  run.quiz = null;
  // Achievement set to museum for this founding
  run.achievement = "museum";

  await saveSoloRun(run);
  return NextResponse.json({ run, museumsFounded: run.museumsFounded });
}
