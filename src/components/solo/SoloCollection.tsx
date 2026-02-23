"use client";

import type { SimArtwork } from "@/lib/solo-engine";

const TIER_BADGE: Record<string, { bg: string; text: string }> = {
  A: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-400" },
  B: { bg: "bg-stone-100 dark:bg-stone-800/50", text: "text-stone-700 dark:text-stone-400" },
  C: { bg: "bg-zinc-100 dark:bg-zinc-800/50", text: "text-zinc-700 dark:text-zinc-400" },
  D: { bg: "bg-slate-100 dark:bg-slate-800/50", text: "text-slate-700 dark:text-slate-400" },
};

interface Props {
  artworks: SimArtwork[];
  cash: number;
  week: number;
  onSell: (index: number) => void;
  onMortgage: (index: number) => void;
  onRepayMortgage: (index: number) => void;
}

export function SoloCollection({ artworks, cash, week, onSell, onMortgage, onRepayMortgage }: Props) {
  if (artworks.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Collection</h2>
        <p className="text-sm text-gray-400 italic py-4">No artworks owned.</p>
      </section>
    );
  }

  // Sort: non-loaned first (highest IV), then loaned
  const sorted = artworks
    .map((a, i) => ({ ...a, originalIndex: i }))
    .sort((a, b) => {
      if (a.onLoan !== b.onLoan) return a.onLoan ? 1 : -1;
      return b.iv - a.iv;
    });

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Collection ({artworks.length})</h2>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500">
            <tr>
              <th className="text-left p-3 font-medium">Artwork</th>
              <th className="text-right p-3 font-medium">IV</th>
              <th className="text-right p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => {
              const badge = TIER_BADGE[a.tier];
              const dealerPrice = Math.round(a.iv * 0.5);
              const canSell = !a.onLoan && !a.mortgaged;
              const canMortgage = !a.onLoan && !a.mortgaged;
              return (
                <tr key={a.originalIndex} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${badge?.bg} ${badge?.text}`}>
                        {a.tier}
                      </span>
                      <span className="font-medium">{a.tags.join(", ")}</span>
                    </div>
                    <p className="text-xs text-gray-400 ml-7">
                      Wk {a.acquiredWeek} &middot; Idle {a.idleWeeks}
                      {a.mortgaged && ` · Mortgage ${a.mortgagePrincipal.toLocaleString()} cr (${a.mortgageWeeksRemaining}wk)`}
                    </p>
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-semibold">{a.iv.toLocaleString()}</span>
                  </td>
                  <td className="p-3 text-right">
                    {a.onLoan && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        Loan ({a.loanWeeksRemaining}wk)
                      </span>
                    )}
                    {a.mortgaged && !a.onLoan && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                        Mortgaged
                      </span>
                    )}
                    {!a.onLoan && !a.mortgaged && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                        Held
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {canSell && (
                        <button
                          onClick={() => onSell(a.originalIndex)}
                          className="text-[10px] font-semibold px-2 py-1 rounded bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity"
                          title={`Sell for ~${dealerPrice.toLocaleString()} cr`}
                        >
                          Sell
                        </button>
                      )}
                      {canMortgage && (
                        <button
                          onClick={() => onMortgage(a.originalIndex)}
                          className="text-[10px] font-semibold px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          Mortgage
                        </button>
                      )}
                      {a.mortgaged && cash >= a.mortgagePrincipal && (
                        <button
                          onClick={() => onRepayMortgage(a.originalIndex)}
                          className="text-[10px] font-semibold px-2 py-1 rounded border border-green-400 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                        >
                          Repay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
