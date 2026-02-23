import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { getSoloRun } from "@/lib/solo-db";
import { buildSoloConfig, runway, totalWeeklyCarry, evaluateAchievement, checkMuseum, tierCounts } from "@/lib/solo-engine";

export const dynamic = "force-dynamic";

// GET /api/solo/runs/[runId] — get full run state
export async function GET(_req: Request, { params }: { params: Promise<{ runId: string }> }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { runId } = await params;
  const run = await getSoloRun(runId, userId);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const cfg = buildSoloConfig(run.configKey);
  const weeklyBurn = totalWeeklyCarry(run.artworks, cfg);
  const rw = runway(run.cash, run.artworks, cfg);
  const achievement = evaluateAchievement(run.artworks, cfg);
  const museumEligible = checkMuseum(run.cash, run.artworks, run.expertise, cfg);
  const counts = tierCounts(run.artworks);

  return NextResponse.json({
    run,
    computed: {
      weeklyBurn,
      runway: rw,
      achievement,
      museumEligible,
      tierCounts: counts,
      config: {
        name: cfg.name,
        maxWeeks: cfg.maxWeeks,
        museum: cfg.museum,
        maxAcquisitionsPerWeek: cfg.maxAcquisitionsPerWeek,
      },
    },
  });
}
