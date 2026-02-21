"use client";

import { useState } from "react";
import Link from "next/link";
import { SURPRISE_PACKAGES, type Artwork, type ArtworkTier } from "@/lib/types";

const pkg = SURPRISE_PACKAGES.mystery;

interface RevealResult {
  artwork: Artwork;
  tier: ArtworkTier;
}

export function SurprisePackagePanel() {
  const [buying, setBuying] = useState(false);
  const [reveal, setReveal] = useState<RevealResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    setBuying(true);
    setError(null);
    setReveal(null);
    try {
      const res = await fetch("/api/buy-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: "mystery" }),
      });
      const data = await res.json();
      if (res.ok) {
        setReveal({ artwork: data.artwork, tier: data.tier });
      } else {
        setError(typeof data.error === "string" ? data.error : "Purchase failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setBuying(false);
    }
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-1">Mystery Package</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Open a mystery package to reveal a random artwork. What you get is a surprise.
      </p>

      {/* Reveal banner */}
      {reveal && (
        <div className="mb-6 border-2 border-green-300 dark:border-green-700 rounded-lg p-5 bg-green-50 dark:bg-green-900/20 animate-in fade-in duration-300">
          <p className="text-lg font-bold text-green-700 dark:text-green-400 mb-1">
            Tier {reveal.tier} Revealed!
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>{reveal.artwork.title}</strong> &mdash; IV{" "}
            {reveal.artwork.insured_value.toLocaleString()} cr
          </p>
          <Link
            href={`/artworks/${reveal.artwork.id}`}
            className="inline-block mt-2 text-sm font-medium text-[var(--accent-dark)] hover:underline"
          >
            View Artwork &rarr;
          </Link>
        </div>
      )}

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="max-w-sm">
        <div className="border-2 border-amber-500/50 rounded-lg overflow-hidden">
          <div className="p-5 bg-amber-50 dark:bg-amber-900/20">
            <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400">{pkg.label} Package</h3>
            <p className="text-2xl font-bold mt-1">{pkg.cost.toLocaleString()} cr</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Contains one artwork of any tier. Results vary.
            </p>

            <button
              type="button"
              onClick={handleBuy}
              disabled={buying}
              className="w-full mt-4 py-2.5 rounded-lg font-bold text-sm bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {buying ? "Opening..." : "Open Mystery Package"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
