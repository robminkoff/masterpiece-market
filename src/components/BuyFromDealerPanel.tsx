"use client";

import { useState } from "react";
import type { EnrichedArtwork } from "@/lib/types";
import { STUB_USER_ID } from "@/lib/supabase";

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

  async function handleBuy() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/buy-from-dealer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artwork_id: artwork.id, buyer_id: STUB_USER_ID }),
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
          Purchased {artwork.title} for {dealerPrice.toLocaleString()} cr from {dealerName}.
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

        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Insured Value</span>
          <span>{artwork.insured_value.toLocaleString()} cr</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>Dealer Markup</span>
          <span>+{(dealerPrice - artwork.insured_value).toLocaleString()} cr ({Math.round((dealerPrice / artwork.insured_value - 1) * 100)}%)</span>
        </div>

        <button
          type="button"
          onClick={handleBuy}
          disabled={submitting}
          className="w-full py-3 rounded-lg font-bold text-sm bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? "Buying..." : `Buy Now — ${dealerPrice.toLocaleString()} cr`}
        </button>

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}
