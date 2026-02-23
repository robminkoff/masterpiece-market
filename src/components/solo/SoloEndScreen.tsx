"use client";

import Link from "next/link";
import type { SoloRunState } from "@/lib/solo-engine";

interface Props {
  run: SoloRunState;
}

export function SoloEndScreen({ run }: Props) {
  const isMuseum = run.outcome === "museum";
  const isBankrupt = run.outcome === "bankruptcy";

  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="text-6xl mb-6">
        {isMuseum ? "\u{1F3DB}" : isBankrupt ? "\u{1F4B8}" : "\u23F0"}
      </div>

      <h1 className="text-3xl font-bold mb-2">
        {isMuseum ? "Museum Founded!" : isBankrupt ? "Bankruptcy" : "Time's Up"}
      </h1>

      <p className="text-gray-500 mb-6">
        {isMuseum && `You founded ${run.museumsFounded} museum${run.museumsFounded !== 1 ? "s" : ""} in ${run.week} weeks.`}
        {isBankrupt && `Your funds ran out at week ${run.week}. Carry costs consumed your credits.`}
        {run.outcome === "timeout" && `You reached the ${run.week}-week time limit.`}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8 text-left">
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500">Final Cash</p>
          <p className="text-xl font-bold">{Number(run.cash).toLocaleString()} cr</p>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500">Weeks Played</p>
          <p className="text-xl font-bold">{run.week}</p>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500">Museums Founded</p>
          <p className="text-xl font-bold">{run.museumsFounded}</p>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Carry Paid</p>
          <p className="text-xl font-bold">{Number(run.totalCarryPaid).toLocaleString()} cr</p>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500">Artworks Remaining</p>
          <p className="text-xl font-bold">{run.artworks.length}</p>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500">Achievement</p>
          <p className="text-xl font-bold">{run.achievement ?? "none"}</p>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Link
          href="/solo"
          className="px-5 py-2.5 rounded-lg bg-[var(--accent-dark)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Back to Solo Hub
        </Link>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
