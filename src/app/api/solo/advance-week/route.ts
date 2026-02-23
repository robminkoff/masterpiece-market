import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { getSoloRun, saveSoloRun } from "@/lib/solo-db";
import {
  buildSoloConfig, advanceWeek, generateLots, generateLoanOffers,
  generateQuiz, evaluateAchievement, weekRng, runway, totalWeeklyCarry,
} from "@/lib/solo-engine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const runId = body.runId as string;
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  const run = await getSoloRun(runId, userId);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (run.outcome) return NextResponse.json({ error: "Run already finished" }, { status: 400 });

  const cfg = buildSoloConfig(run.configKey);

  // Timeout check
  if (run.week >= cfg.maxWeeks) {
    const achievement = evaluateAchievement(run.artworks, cfg);
    run.outcome = "timeout";
    run.achievement = achievement;
    run.finishedAt = new Date().toISOString();
    await saveSoloRun(run);
    return NextResponse.json({ run, event: "timeout" });
  }

  // Execute the automated advance-week phase
  const state = {
    week: run.week,
    cash: run.cash,
    artworks: run.artworks,
    expertise: run.expertise,
    totalCarryPaid: run.totalCarryPaid,
    seed: run.seed,
  };

  const result = advanceWeek(state, cfg);

  // Update run from mutated state
  run.week = state.week;
  run.cash = state.cash;
  run.artworks = state.artworks;
  run.totalCarryPaid = state.totalCarryPaid;

  if (result.bankrupt) {
    const achievement = evaluateAchievement(run.artworks, cfg);
    run.outcome = "bankruptcy";
    run.achievement = achievement;
    run.finishedAt = new Date().toISOString();
    run.pendingLots = [];
    run.pendingLoans = [];
    run.quiz = null;
    await saveSoloRun(run);
    return NextResponse.json({ run, event: "bankruptcy", carryPaid: result.carryPaid });
  }

  // Generate this week's content
  const rng = weekRng(run.seed, run.week);
  run.pendingLots = generateLots(cfg, rng);
  run.pendingLoans = generateLoanOffers(run.artworks, cfg, rng);
  run.quiz = cfg.quiz.enabled ? generateQuiz(run.seed, run.week) : null;

  // Update achievement
  const achievement = evaluateAchievement(run.artworks, cfg);
  run.achievement = achievement;

  await saveSoloRun(run);

  return NextResponse.json({
    run,
    event: "advance",
    carryPaid: result.carryPaid,
    forcedSales: result.forcedSales,
    museumEligible: result.museumEligible,
    weeklyBurn: totalWeeklyCarry(run.artworks, cfg),
    runway: runway(run.cash, run.artworks, cfg),
  });
}
