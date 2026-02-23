"use client";

import type { AuctionLot } from "@/lib/solo-engine";

const TIER_BADGE: Record<string, { bg: string; text: string }> = {
  A: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-400" },
  B: { bg: "bg-stone-100 dark:bg-stone-800/50", text: "text-stone-700 dark:text-stone-400" },
  C: { bg: "bg-zinc-100 dark:bg-zinc-800/50", text: "text-zinc-700 dark:text-zinc-400" },
  D: { bg: "bg-slate-100 dark:bg-slate-800/50", text: "text-slate-700 dark:text-slate-400" },
};

interface Props {
  lots: AuctionLot[];
  cash: number;
  onBuy: (lotIndex: number) => void;
}

export function SoloAuctionLots({ lots, cash, onBuy }: Props) {
  // Group by tier for display
  const tiers = ["A", "B", "C", "D"] as const;
  const grouped = tiers.map((t) => ({
    tier: t,
    lots: lots.filter((l) => l.tier === t),
  })).filter((g) => g.lots.length > 0);

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Available Lots</h2>
      <p className="text-xs text-gray-500 mb-3">NPC auction has settled. Buy at clearing price + 5% buyer premium.</p>
      <div className="space-y-3">
        {grouped.map(({ tier, lots: tierLots }) => (
          <div key={tier}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${TIER_BADGE[tier]?.bg} ${TIER_BADGE[tier]?.text}`}>
                Tier {tier}
              </span>
              <span className="text-xs text-gray-400">{tierLots.length} available</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tierLots.map((lot) => {
                const canAfford = cash >= lot.totalCost;
                return (
                  <div
                    key={lot.index}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">IV {lot.iv.toLocaleString()} cr</p>
                      <p className="text-xs text-gray-400">
                        {lot.tags.join(", ")} &middot; {lot.totalCost.toLocaleString()} cr total
                      </p>
                    </div>
                    <button
                      onClick={() => onBuy(lot.index)}
                      disabled={!canAfford}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      Buy
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
