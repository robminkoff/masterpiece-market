"use client";

import { useState } from "react";
import type { QuizState } from "@/lib/solo-engine";

interface Props {
  quiz: QuizState;
  onAnswer: (answerIndex: number) => Promise<{ correct: boolean; correctIndex: number } | null>;
}

export function SoloQuizCard({ quiz, onAnswer }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; correctIndex: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (selectedIndex === null) return;
    setSubmitting(true);
    const res = await onAnswer(selectedIndex);
    if (res) setResult(res);
    setSubmitting(false);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Weekly Quiz</h2>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <p className="text-sm font-medium mb-3">{quiz.question}</p>
        <div className="space-y-2 mb-4">
          {quiz.options.map((option, i) => {
            let style = "border-gray-200 dark:border-gray-700";
            if (result) {
              if (i === result.correctIndex) style = "border-green-500 bg-green-50 dark:bg-green-900/20";
              else if (i === selectedIndex && !result.correct) style = "border-red-500 bg-red-50 dark:bg-red-900/20";
            } else if (i === selectedIndex) {
              style = "border-[var(--accent)] bg-amber-50 dark:bg-amber-900/10";
            }
            return (
              <button
                key={i}
                onClick={() => !result && setSelectedIndex(i)}
                disabled={!!result}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${style}`}
              >
                {option}
              </button>
            );
          })}
        </div>
        {!result ? (
          <button
            onClick={handleSubmit}
            disabled={selectedIndex === null || submitting}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {submitting ? "Submitting..." : "Submit Answer"}
          </button>
        ) : (
          <p className={`text-sm font-semibold ${result.correct ? "text-green-600" : "text-red-600"}`}>
            {result.correct ? "+1 Expertise!" : "Incorrect."}
          </p>
        )}
      </div>
    </section>
  );
}
