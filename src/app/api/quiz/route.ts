import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { getProfile, canTakeQuizToday, recordQuizResult } from "@/lib/db";
import { QUIZ_QUESTIONS } from "@/data/quiz-questions";

function getTodaysQuestion() {
  // Deterministic question from date hash
  const today = new Date();
  const dateStr = `${today.getUTCFullYear()}-${today.getUTCMonth()}-${today.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % QUIZ_QUESTIONS.length;
  return QUIZ_QUESTIONS[idx];
}

// GET /api/quiz — today's question + canTake flag
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const canTake = await canTakeQuizToday(userId);
  const question = getTodaysQuestion();

  return NextResponse.json({
    question: {
      id: question.id,
      question: question.question,
      options: question.options,
    },
    canTake,
    expertise: profile.expertise,
  });
}

// POST /api/quiz — submit answer
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canTake = await canTakeQuizToday(userId);
    if (!canTake) {
      return NextResponse.json({ error: "Already taken quiz today" }, { status: 400 });
    }

    const body = await request.json();
    const { questionId, answerIndex } = body ?? {};
    if (typeof questionId !== "string" || typeof answerIndex !== "number") {
      return NextResponse.json({ error: "questionId and answerIndex required" }, { status: 400 });
    }

    const todaysQuestion = getTodaysQuestion();
    if (todaysQuestion.id !== questionId) {
      return NextResponse.json({ error: "Question does not match today's quiz" }, { status: 400 });
    }

    const correct = answerIndex === todaysQuestion.correctIndex;
    const { expertiseGained, newExpertise } = await recordQuizResult(userId, correct);

    return NextResponse.json({
      correct,
      correctIndex: todaysQuestion.correctIndex,
      expertiseGained,
      newExpertise,
    });
  } catch (err) {
    console.error("Quiz POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
