"use client";

import { useState } from "react";
import Link from "next/link";
import { SURPRISE_PACKAGES, type PackageKey, type Artwork, type ArtworkTier } from "@/lib/types";

const PACKAGE_KEYS: PackageKey[] = ["bronze", "silver", "gold"];

const TIER_LABELS: Record<ArtworkTier, string> = {
  A: "Iconic",
  B: "Major",
  C: "Mid",
  D: "Minor",
};

const PACKAGE_COLORS: Record<PackageKey, { border: string; bg: string; accent: string }> = {
  bronze: {
    border: "border-amber-600/40",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    accent: "text-amber-700 dark:text-amber-400",
  },
  silver: {
    border: "border-gray-400/60",
    bg: "bg-gray-50 dark:bg-gray-800/40",
    accent: "text-gray-600 dark:text-gray-300",
  },
  gold: {
    border: "border-yellow-500/60",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    accent: "text-yellow-700 dark:text-yellow-400",
  },
};

interface RevealResult {
  artwork: Artwork;
  tier: ArtworkTier;
  packageLabel: string;
}

export function SurprisePackagePanel() {
  const [buying, setBuying] = useState<PackageKey | null>(null);
  const [reveal, setReveal] = useState<RevealResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(key: PackageKey) {
    setBuying(key);
    setError(null);
    setReveal(null);
    try {
      const res = await fetch("/api/buy-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: key }),
      });
      const data = await res.json();
      if (res.ok) {
        setReveal({
          artwork: data.artwork,
          tier: data.tier,
          packageLabel: data.package,
        });
      } else {
        setError(typeof data.error === "string" ? data.error : "Purchase failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setBuying(null);
    }
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-1">Surprise Packages</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Open a mystery package to reveal a random artwork. Higher tiers have better odds in pricier packages.
      </p>

      {/* Reveal banner */}
      {reveal && (
        <div className="mb-6 border-2 border-green-300 dark:border-green-700 rounded-lg p-5 bg-green-50 dark:bg-green-900/20 animate-in fade-in duration-300">
          <p className="text-lg font-bold text-green-700 dark:text-green-400 mb-1">
            Tier {reveal.tier} Revealed!
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>{reveal.artwork.title}</strong> &mdash; IV{" "}
            {reveal.artwork.insured_value.toLocaleString()} cr ({TIER_LABELS[reveal.tier]})
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PACKAGE_KEYS.map((key) => {
          const pkg = SURPRISE_PACKAGES[key];
          const colors = PACKAGE_COLORS[key];
          return (
            <div
              key={key}
              className={`border-2 ${colors.border} rounded-lg overflow-hidden`}
            >
              <div className={`p-4 ${colors.bg}`}>
                <h3 className={`text-lg font-bold ${colors.accent}`}>{pkg.label} Package</h3>
                <p className="text-2xl font-bold mt-1">{pkg.cost.toLocaleString()} cr</p>

                <div className="mt-3 space-y-0.5">
                  {(["A", "B", "C", "D"] as ArtworkTier[]).map((t) => (
                    <div key={t} className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Tier {t} ({TIER_LABELS[t]})</span>
                      <span className="font-medium">{Math.round(pkg.tiers[t] * 100)}%</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleBuy(key)}
                  disabled={buying !== null}
                  className="w-full mt-4 py-2.5 rounded-lg font-bold text-sm bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {buying === key ? "Opening..." : `Open ${pkg.label} Package`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
