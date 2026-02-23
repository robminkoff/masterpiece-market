"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAvailablePresets } from "@/lib/solo-engine";

interface RunSummary {
  id: string;
  configKey: string;
  week: number;
  cash: number;
  outcome: string | null;
  achievement: string | null;
  museumsFounded: number;
  artworks: { tier: string }[];
  createdAt?: string;
  startedAt: string;
  finishedAt: string | null;
}

export default function SoloHubPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("default");
  const presets = getAvailablePresets();

  const loadRuns = useCallback(() => {
    fetch("/api/solo/runs")
      .then((r) => r.json())
      .then((data) => {
        setRuns(
          (data.runs ?? []).map((r: Record<string, unknown>) => ({
            id: r.id,
            configKey: r.configKey,
            week: r.week,
            cash: r.cash,
            outcome: r.outcome,
            achievement: r.achievement,
            museumsFounded: r.museumsFounded,
            artworks: r.artworks as { tier: string }[],
            startedAt: r.startedAt,
            finishedAt: r.finishedAt,
          })),
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  async function handleNewRun() {
    setCreating(true);
    const res = await fetch("/api/solo/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configKey: selectedPreset }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/solo/play?run=${data.run.id}`);
    } else {
      const err = await res.json();
      if (err.activeRunId) {
        router.push(`/solo/play?run=${err.activeRunId}`);
      } else {
        alert(err.error ?? "Failed to create run");
      }
    }
    setCreating(false);
  }

  const activeRun = runs.find((r) => !r.outcome);
  const pastRuns = runs.filter((r) => r.outcome);

  if (loading) return <p className="text-gray-500 py-12 text-center">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Solo Mode</h1>
      <p className="text-gray-500 mb-8">
        Turn-based single-player. Advance week by week, buy artworks, manage loans,
        and found museums. Play in one sitting or come back later.
      </p>

      {/* Active run */}
      {activeRun && (
        <div className="border border-[var(--accent)] rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-dark)]">Active Run</span>
              <p className="text-sm text-gray-500 mt-0.5">Week {activeRun.week} &middot; {activeRun.artworks.length} artworks &middot; {Number(activeRun.cash).toLocaleString()} cr</p>
            </div>
            <button
              onClick={() => router.push(`/solo/play?run=${activeRun.id}`)}
              className="px-5 py-2.5 rounded-lg bg-[var(--accent-dark)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
          {activeRun.museumsFounded > 0 && (
            <p className="text-xs text-gray-400">{activeRun.museumsFounded} museum{activeRun.museumsFounded !== 1 ? "s" : ""} founded</p>
          )}
        </div>
      )}

      {/* New run */}
      {!activeRun && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-3">New Run</h2>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Difficulty</label>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
              >
                {presets.map((p) => (
                  <option key={p.key} value={p.key}>{p.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleNewRun}
              disabled={creating}
              className="px-5 py-2.5 rounded-lg bg-[var(--accent-dark)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {creating ? "Starting..." : "Start Run"}
            </button>
          </div>
        </div>
      )}

      {/* Past runs */}
      {pastRuns.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Past Runs</h2>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500">
                <tr>
                  <th className="text-left p-3 font-medium">Outcome</th>
                  <th className="text-right p-3 font-medium">Weeks</th>
                  <th className="text-right p-3 font-medium">Museums</th>
                  <th className="text-right p-3 font-medium">Achievement</th>
                  <th className="text-right p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {pastRuns.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="p-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        r.outcome === "museum" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                        r.outcome === "bankruptcy" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                        "bg-gray-100 dark:bg-gray-800 text-gray-500"
                      }`}>
                        {r.outcome}
                      </span>
                    </td>
                    <td className="p-3 text-right">{r.week}</td>
                    <td className="p-3 text-right">{r.museumsFounded}</td>
                    <td className="p-3 text-right">
                      {r.achievement && (
                        <span className="text-xs font-medium">{r.achievement}</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-xs text-gray-400">
                      {r.finishedAt ? new Date(r.finishedAt).toLocaleDateString() : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
