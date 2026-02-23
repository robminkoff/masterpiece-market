import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { getSoloRun, saveSoloRun } from "@/lib/solo-db";

export const dynamic = "force-dynamic";

// POST /api/solo/quiz — answer this week's quiz question
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { runId, answerIndex } = body;
  if (!runId || answerIndex === undefined) {
    return NextResponse.json({ error: "runId and answerIndex required" }, { status: 400 });
  }

  const run = await getSoloRun(runId, userId);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (run.outcome) return NextResponse.json({ error: "Run already finished" }, { status: 400 });

  if (!run.quiz) return NextResponse.json({ error: "No quiz available this week" }, { status: 400 });
  if (run.quiz.answered) return NextResponse.json({ error: "Quiz already answered this week" }, { status: 400 });

  const correct = answerIndex === run.quiz.correctIndex;
  if (correct) {
    run.expertise += 1;
  }
  run.quiz.answered = true;

  await saveSoloRun(run);
  return NextResponse.json({
    run,
    correct,
    correctIndex: run.quiz.correctIndex,
    expertiseGained: correct ? 1 : 0,
  });
}
