"use client";

import { useState } from "react";
import type { EnrichedArtwork, Ownership } from "@/lib/types";
import { DEALER_BUY_RATE, AUCTION_BACKSTOP_RATE, canResell } from "@/lib/types";

interface SellOptionsPanelProps {
  artwork: EnrichedArtwork;
  ownership: Ownership;
  inAuction?: boolean;
  onSold?: () => void;
}

export function SellOptionsPanel({ artwork, ownership, inAuction, onSold }: SellOptionsPanelProps) {
  const [submitting, setSubmitting] = useState<"dealer" | "auction" | null>(null);
  const [confirmAction, setConfirmAction] = useState<"dealer" | "auction" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<"sold" | "auctioned" | null>(null);

  const holdOk = canResell(ownership.acquired_at);
  const onLoan = ownership.on_loan;
  const iv = artwork.insured_value;

  const dealerPrice = Math.round(iv * DEALER_BUY_RATE);
  const auctionFloor = Math.round(iv * AUCTION_BACKSTOP_RATE);

  async function handleSellToDealer() {
    setSubmitting("dealer");
    setError(null);
    try {
      const res = await fetch("/api/sell-to-dealer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artwork_id: artwork.id }),
      });
      if (res.ok) {
        setResult("sold");
        onSold?.();
      } else {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Sale failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(null);
      setConfirmAction(null);
    }
  }

  async function handleSendToAuction() {
    setSubmitting("auction");
    setError(null);
    try {
      const res = await fetch("/api/send-to-auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artwork_id: artwork.id }),
      });
      if (res.ok) {
        setResult("auctioned");
        onSold?.();
      } else {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Submission failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(null);
      setConfirmAction(null);
    }
  }

  if (result === "sold") {
    return (
      <div className="border-2 border-green-300 dark:border-green-700 rounded-lg p-5 bg-green-50 dark:bg-green-900/20">
        <p className="text-lg font-bold text-green-700 dark:text-green-400">Sold!</p>
        <p className="text-sm text-gray-500 mt-1">
          {artwork.title} sold to dealer for {dealerPrice.toLocaleString()} cr.
        </p>
      </div>
    );
  }

  if (result === "auctioned") {
    return (
      <div className="border-2 border-blue-300 dark:border-blue-700 rounded-lg p-5 bg-blue-50 dark:bg-blue-900/20">
        <p className="text-lg font-bold text-blue-700 dark:text-blue-400">Sent to Auction!</p>
        <p className="text-sm text-gray-500 mt-1">
          {artwork.title} submitted. Starting bid: {auctionFloor.toLocaleString()} cr.
          Check the Auction House for updates.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">Sell This Artwork</h3>

      {/* Guards */}
      {!holdOk && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
          24-hour hold: You must wait before selling this artwork.
        </p>
      )}
      {onLoan && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
          This artwork is currently on loan and cannot be sold.
        </p>
      )}
      {inAuction && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
          This artwork is already submitted to auction.
        </p>
      )}

      {holdOk && !onLoan && !inAuction && (
        <div className="space-y-4">
          {/* Option 1: Sell to Dealer */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Sell to Dealer</h4>
              <span className="text-lg font-bold text-[var(--accent-dark)]">
                {dealerPrice.toLocaleString()} cr
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Instant sale at 50% of insured value. Guaranteed, irreversible.
            </p>

            {confirmAction === "dealer" ? (
              <div className="space-y-2">
                <p className="text-xs text-red-500 font-medium">
                  Instant and irreversible. Are you sure?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSellToDealer}
                    disabled={submitting === "dealer"}
                    className="flex-1 py-2 rounded font-semibold text-sm bg-red-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting === "dealer" ? "Selling..." : "Confirm Sale"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="px-4 py-2 rounded text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setConfirmAction("dealer"); setError(null); }}
                className="w-full py-2 rounded font-semibold text-sm bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity"
              >
                Sell to Dealer — {dealerPrice.toLocaleString()} cr
              </button>
            )}
          </div>

          {/* Option 2: Send to Auction */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Send to Auction</h4>
              <span className="text-sm text-gray-400">Floor: {auctionFloor.toLocaleString()} cr</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Starting bid {auctionFloor.toLocaleString()} cr. Could sell for more — or if no bids, a dealer buys at this price.
            </p>

            {confirmAction === "auction" ? (
              <div className="space-y-2">
                <p className="text-xs text-yellow-600 font-medium">
                  Once submitted, you cannot withdraw. Forced acceptance.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSendToAuction}
                    disabled={submitting === "auction"}
                    className="flex-1 py-2 rounded font-semibold text-sm bg-blue-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting === "auction" ? "Submitting..." : "Confirm Auction"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="px-4 py-2 rounded text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setConfirmAction("auction"); setError(null); }}
                className="w-full py-2 rounded font-semibold text-sm border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                Send to Auction
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
