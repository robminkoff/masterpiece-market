"use client";

import { useState } from "react";
import type { SimArtwork } from "@/lib/solo-engine";

const TIER_BADGE: Record<string, { bg: string; text: string }> = {
  A: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-400" },
  B: { bg: "bg-stone-100 dark:bg-stone-800/50", text: "text-stone-700 dark:text-stone-400" },
  C: { bg: "bg-zinc-100 dark:bg-zinc-800/50", text: "text-zinc-700 dark:text-zinc-400" },
  D: { bg: "bg-slate-100 dark:bg-slate-800/50", text: "text-slate-700 dark:text-slate-400" },
};

type AchievementTier = "none" | "exhibition" | "gallery" | "wing" | "museum";

const ACHIEVEMENT_ORDER: AchievementTier[] = ["none", "exhibition", "gallery", "wing", "museum"];
const ACHIEVEMENT_LABELS: Record<AchievementTier, string> = {
  none: "Start",
  exhibition: "Hall",
  gallery: "Gallery",
  wing: "Wing",
  museum: "Museum",
};

interface Props {
  artworks: SimArtwork[];
  cash: number;
  expertise: number;
  achievement: string | null;
  museumEligible: boolean;
  museumConfig: {
    minA: number; minB: number; minC: number; minD: number;
    minTotal: number; minTagDiversity: number; endowmentWeeks: number; minPrestige: number;
  };
  onFoundMuseum: () => void;
}

export function SoloMuseumProgress({ artworks, cash, expertise, achievement, museumEligible, museumConfig, onFoundMuseum }: Props) {
  const [founding, setFounding] = useState(false);

  const tierCounts = { A: 0, B: 0, C: 0, D: 0 };
  for (const a of artworks) if (a.tier in tierCounts) tierCounts[a.tier as keyof typeof tierCounts]++;
  const uniqueTags = new Set(artworks.flatMap((a) => a.tags)).size;
  const mortgageCount = artworks.filter((a) => a.mortgaged).length;

  // Achievement tier bar
  const currentAchievement = (achievement as AchievementTier) ?? "none";
  const currentIdx = ACHIEVEMENT_ORDER.indexOf(currentAchievement);

  // Requirements checklist
  const reqs = [
    { label: `Tier A: ${tierCounts.A}/${museumConfig.minA}`, met: tierCounts.A >= museumConfig.minA },
    { label: `Tier B: ${tierCounts.B}/${museumConfig.minB}`, met: tierCounts.B >= museumConfig.minB },
    { label: `Tier C: ${tierCounts.C}/${museumConfig.minC}`, met: tierCounts.C >= museumConfig.minC },
    { label: `Tier D: ${tierCounts.D}/${museumConfig.minD}`, met: tierCounts.D >= museumConfig.minD },
    { label: `Total: ${artworks.length}/${museumConfig.minTotal}`, met: artworks.length >= museumConfig.minTotal },
    { label: `Tags: ${uniqueTags}/${museumConfig.minTagDiversity}`, met: uniqueTags >= museumConfig.minTagDiversity },
    { label: `Expertise: ${expertise}/${museumConfig.minPrestige}`, met: expertise >= museumConfig.minPrestige },
    { label: `Mortgages cleared`, met: mortgageCount === 0 },
  ];
  const metCount = reqs.filter((r) => r.met).length;

  async function handleFound() {
    setFounding(true);
    onFoundMuseum();
    setFounding(false);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Museum Progress</h2>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4">
        {/* Achievement tier bar */}
        <div className="flex items-center gap-1">
          {ACHIEVEMENT_ORDER.map((tier, i) => {
            const reached = i <= currentIdx;
            const isCurrent = i === currentIdx;
            const isLast = i === ACHIEVEMENT_ORDER.length - 1;
            return (
              <div key={tier} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
                <span className={`text-[10px] font-semibold whitespace-nowrap ${
                  isCurrent ? "text-[var(--accent-dark)]" : reached ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"
                }`}>
                  {ACHIEVEMENT_LABELS[tier]}
                </span>
                {!isLast && (
                  <div className={`h-1.5 flex-1 rounded-full mx-1.5 ${i < currentIdx ? "bg-[var(--accent)]" : "bg-gray-200 dark:bg-gray-700"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Tier slots */}
        <div className="grid grid-cols-4 gap-3">
          {(["A", "B", "C", "D"] as const).map((tier) => {
            const current = tierCounts[tier];
            const target = museumConfig[`min${tier}` as keyof typeof museumConfig] as number;
            const met = current >= target;
            const badge = TIER_BADGE[tier];
            return (
              <div key={tier} className="flex flex-col items-center gap-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>{tier}</span>
                <span className={`text-sm font-medium ${met ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                  {current} / {target}
                </span>
              </div>
            );
          })}
        </div>

        {/* Requirements */}
        <div className="flex flex-wrap gap-2">
          {reqs.map((r) => (
            <span
              key={r.label}
              className={`text-xs px-2 py-1 rounded ${
                r.met
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              }`}
            >
              {r.label}
            </span>
          ))}
        </div>

        {/* Found button */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {metCount} of {reqs.length} requirements met
          </span>
          <button
            onClick={handleFound}
            disabled={!museumEligible || founding}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {founding ? "Founding..." : "Found Museum & Ascend"}
          </button>
        </div>
      </div>
    </section>
  );
}
