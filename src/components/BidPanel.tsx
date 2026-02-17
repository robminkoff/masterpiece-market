"use client";

import { useState } from "react";

interface BidPanelProps {
  currentBid: number;
  minIncrement?: number;
  onBid: (amount: number) => void;
  disabled?: boolean;
}

export function BidPanel({ currentBid, minIncrement = 1000, onBid, disabled }: BidPanelProps) {
  const nextMin = currentBid + minIncrement;
  const [amount, setAmount] = useState(nextMin);

  const quickBids = [
    { label: `+${minIncrement.toLocaleString()}`, value: nextMin },
    { label: `+${(minIncrement * 2).toLocaleString()}`, value: currentBid + minIncrement * 2 },
    { label: `+${(minIncrement * 5).toLocaleString()}`, value: currentBid + minIncrement * 5 },
  ];

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">Place a Bid</h3>

      <div className="mb-3">
        <label className="text-xs text-gray-500 block mb-1">
          Current bid: {currentBid.toLocaleString()} cr &middot; Min next: {nextMin.toLocaleString()} cr
        </label>
        <input
          type="number"
          min={nextMin}
          step={minIncrement}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-900"
          disabled={disabled}
        />
      </div>

      <div className="flex gap-2 mb-3">
        {quickBids.map((q) => (
          <button
            key={q.value}
            onClick={() => setAmount(q.value)}
            className="text-xs px-3 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={disabled}
          >
            {q.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => onBid(amount)}
        disabled={disabled || amount < nextMin}
        className="w-full bg-[var(--accent-dark)] text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Bid {amount.toLocaleString()} cr
      </button>
    </div>
  );
}
