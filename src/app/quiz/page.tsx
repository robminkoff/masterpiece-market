"use client";

import { useEffect, useState } from "react";

interface QuizData {
  question: { id: string; question: string; options: string[] };
  canTake: boolean;
  expertise: number;
}

interface QuizResult {
  correct: boolean;
  correctIndex: number;
  expertiseGained: number;
  newExpertise: number;
}

export default function QuizPage() {
  const [data, setData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/quiz")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (selected === null || !data) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: data.question.id, answerIndex: selected }),
      });
      const r = await res.json();
      if (!res.ok) {
        setError(r.error ?? "Something went wrong");
      } else {
        setResult(r);
      }
    } catch {
      setError("Failed to submit answer. Please try again.");
    }
    setSubmitting(false);
  }

  if (loading) return <p className="text-gray-500 py-12 text-center">Loading quiz...</p>;
  if (!data) return <p className="text-red-500 py-12 text-center">Could not load quiz.</p>;

  const answered = result !== null;
  const canTake = data.canTake && !answered;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Daily Quiz</h1>
      <p className="text-sm text-gray-500 mb-6">
        Answer correctly to earn <strong>1 expertise</strong>. One attempt per day.
      </p>

      {!data.canTake && !answered && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 text-center">
          <p className="text-lg font-semibold mb-1">Already completed today</p>
          <p className="text-sm text-gray-500">Come back tomorrow for a new question.</p>
          <p className="text-sm text-gray-400 mt-3">Current expertise: <strong>{data.expertise}</strong></p>
        </div>
      )}

      {(data.canTake || answered) && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{data.question.question}</h2>

          <div className="space-y-2">
            {data.question.options.map((opt, i) => {
              let style = "border-gray-200 dark:border-gray-700 hover:border-[var(--accent-dark)] hover:bg-amber-50 dark:hover:bg-amber-900/10";

              if (answered) {
                if (i === result.correctIndex) {
                  style = "border-green-500 bg-green-50 dark:bg-green-900/20";
                } else if (i === selected && !result.correct) {
                  style = "border-red-500 bg-red-50 dark:bg-red-900/20";
                } else {
                  style = "border-gray-200 dark:border-gray-800 opacity-50";
                }
              } else if (i === selected) {
                style = "border-[var(--accent-dark)] bg-amber-50 dark:bg-amber-900/20";
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={answered}
                  onClick={() => !answered && setSelected(i)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${style}`}
                >
                  <span className="text-sm font-medium">{opt}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {!answered && canTake && (
            <button
              type="button"
              disabled={selected === null || submitting}
              onClick={handleSubmit}
              className="mt-4 w-full py-2.5 rounded-lg bg-[var(--accent-dark)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Answer"}
            </button>
          )}

          {answered && (
            <div className={`mt-4 p-4 rounded-lg ${result.correct ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"}`}>
              <p className={`font-semibold ${result.correct ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                {result.correct ? "Correct!" : "Incorrect"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {result.correct
                  ? `+${result.expertiseGained} expertise earned.`
                  : `The correct answer was: ${data.question.options[result.correctIndex]}`}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Total expertise: <strong>{result.newExpertise}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
