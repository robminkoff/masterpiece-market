"use client";

import { useState } from "react";
import type { EnrichedArtwork } from "@/lib/types";
import { BUYER_PREMIUM_RATE } from "@/lib/types";

interface BuyFromDealerPanelProps {
  artwork: EnrichedArtwork;
  dealerPrice: number;
  dealerName: string;
  onBought?: () => void;
}

export function BuyFromDealerPanel({ artwork, dealerPrice, dealerName, onBought }: BuyFromDealerPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bought, setBought] = useState(false);

  const buyerPremium = Math.round(dealerPrice * BUYER_PREMIUM_RATE);
  const totalCost = dealerPrice + buyerPremium;

  async function handleBuy() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/buy-from-dealer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artwork_id: artwork.id }),
      });
      if (res.ok) {
        setBought(true);
        onBought?.();
      } else {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Purchase failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (bought) {
    return (
      <div className="border-2 border-green-300 dark:border-green-700 rounded-lg p-5 bg-green-50 dark:bg-green-900/20">
        <p className="text-lg font-bold text-green-700 dark:text-green-400">It&rsquo;s yours!</p>
        <p className="text-sm text-gray-500 mt-1">
          Purchased {artwork.title} for {totalCost.toLocaleString()} cr from {dealerName}.
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-[var(--accent-dark)] rounded-lg overflow-hidden">
      <div className="p-5 bg-amber-50 dark:bg-amber-900/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-[var(--accent-dark)]">For Sale</h3>
            <p className="text-xs text-gray-400 mt-0.5">via {dealerName}</p>
          </div>
          <span className="text-2xl font-bold">{dealerPrice.toLocaleString()} cr</span>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mb-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Asking Price</span>
            <span>{dealerPrice.toLocaleString()} cr</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Buyer&rsquo;s Premium ({Math.round(BUYER_PREMIUM_RATE * 100)}%)</span>
            <span>+{buyerPremium.toLocaleString()} cr</span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 pt-1 border-t border-dashed border-gray-300 dark:border-gray-600">
            <span>Total</span>
            <span>{totalCost.toLocaleString()} cr</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleBuy}
          disabled={submitting}
          className="w-full py-3 rounded-lg font-bold text-sm bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? "Buying..." : `Buy Now — ${totalCost.toLocaleString()} cr`}
        </button>

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}
