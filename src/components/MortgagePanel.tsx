"use client";

import { useEffect, useState } from "react";
import type { Mortgage } from "@/lib/types";
import { MORTGAGE_CONFIG } from "@/lib/types";

interface Props {
  artworkId: string;
  artworkIv: number;
  onLoan: boolean;
  onUpdate: () => void;
}

export function MortgagePanel({ artworkId, artworkIv, onLoan, onUpdate }: Props) {
  const [mortgage, setMortgage] = useState<Mortgage | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetch("/api/mortgage")
      .then((r) => r.json())
      .then((data) => {
        const m = (data.mortgages ?? []).find((m: Mortgage) => m.artwork_id === artworkId);
        setMortgage(m ?? null);
      })
      .finally(() => setLoading(false));
  }, [artworkId]);

  async function handleTake() {
    setActing(true);
    const res = await fetch("/api/mortgage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artwork_id: artworkId }),
    });
    if (res.ok) {
      const data = await res.json();
      setMortgage(data.mortgage);
      onUpdate();
    } else {
      const err = await res.json();
      alert(err.error ?? "Failed to take mortgage");
    }
    setActing(false);
  }

  async function handleRepay() {
    if (!mortgage) return;
    setActing(true);
    const res = await fetch("/api/mortgage/repay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mortgage_id: mortgage.id }),
    });
    if (res.ok) {
      setMortgage(null);
      onUpdate();
    } else {
      const err = await res.json();
      alert(err.error ?? "Failed to repay mortgage");
    }
    setActing(false);
  }

  if (loading) return null;

  const principal = Math.round(artworkIv * MORTGAGE_CONFIG.ltvRate);
  const weeklyInterest = Math.round(principal * MORTGAGE_CONFIG.weeklyInterestRate);

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">Mortgage</h3>

      {mortgage ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">Principal</span>
              <p className="font-semibold">{mortgage.principal.toLocaleString()} cr</p>
            </div>
            <div>
              <span className="text-gray-400">Weeks left</span>
              <p className="font-semibold">{mortgage.weeks_remaining} / {mortgage.term_weeks}</p>
            </div>
            <div>
              <span className="text-gray-400">Weekly interest</span>
              <p className="font-semibold">{Math.round(mortgage.principal * mortgage.weekly_interest_rate).toLocaleString()} cr</p>
            </div>
            <div>
              <span className="text-gray-400">Status</span>
              <p className="font-semibold capitalize">{mortgage.status}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={acting}
            onClick={handleRepay}
            className="w-full mt-2 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {acting ? "Repaying..." : `Repay ${mortgage.principal.toLocaleString()} cr`}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-2">
            Borrow <strong>{principal.toLocaleString()} cr</strong> (50% of IV) at {MORTGAGE_CONFIG.weeklyInterestRate * 100}% interest/week for {MORTGAGE_CONFIG.termWeeks} weeks.
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Weekly interest: {weeklyInterest.toLocaleString()} cr. Mortgaged works cannot be loaned.
          </p>
          <button
            type="button"
            disabled={acting || onLoan}
            onClick={handleTake}
            className="w-full py-2 rounded-lg bg-[var(--accent-dark)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {acting ? "Processing..." : onLoan ? "Cannot mortgage (on loan)" : `Take Mortgage — ${principal.toLocaleString()} cr`}
          </button>
        </div>
      )}
    </div>
  );
}
