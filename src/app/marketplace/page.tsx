"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Artwork, ArtworkTier, Auction } from "@/lib/types";
import { ArtFrame } from "@/components/ArtFrame";
import { useScrollRestore } from "@/lib/useScrollRestore";

const TIERS: (ArtworkTier | "all")[] = ["all", "A", "B", "C", "D"];

interface InventoryItem {
  artwork: Artwork;
  dealer_id: string;
  dealer_name: string;
  dealer_slug: string;
  asking_price: number;
}

export default function MarketplacePage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<ArtworkTier | "all">("all");
  const { ready } = useScrollRestore();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tierFilter !== "all") params.set("tier", tierFilter);

    Promise.all([
      fetch(`/api/dealer-inventory?${params}`).then((r) => r.json()),
      fetch("/api/auctions").then((r) => r.json()),
    ]).then(([invData, aucData]) => {
      setInventory(invData.inventory ?? []);
      setUpcomingAuctions(
        ((aucData.auctions ?? []) as Auction[]).filter((a) => a.status === "scheduled"),
      );
      setLoading(false);
      requestAnimationFrame(() => ready());
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierFilter]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Browse dealer inventory. Buy directly at the listed price.
        </p>
      </div>

      {/* Tier filters */}
      <div className="flex gap-2 mb-6">
        {TIERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTierFilter(t)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tierFilter === t
                ? "bg-[var(--accent-dark)] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {t === "all" ? "All Tiers" : `Tier ${t}`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading inventory...</p>
      ) : inventory.length === 0 ? (
        <p className="text-gray-400 italic">No dealer inventory found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {inventory.map((item) => (
            <Link
              key={item.artwork.id}
              href={`/artworks/${item.artwork.id}`}
              className="group border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:border-[var(--accent-dark)] transition-colors"
            >
              <div className="flex justify-center p-4 pb-2">
                <ArtFrame src={item.artwork.image_url} alt={item.artwork.title} tier={item.artwork.tier} size="sm" />
              </div>
              <div className="px-4 pb-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                    {item.dealer_name}
                  </span>
                </div>
                <h3 className="font-semibold text-sm leading-tight">{item.artwork.title}</h3>
                <p className="text-xs text-gray-400">{item.artwork.artist}</p>
                <p className="mt-2 text-lg font-bold text-[var(--accent-dark)]">
                  {item.asking_price.toLocaleString()} cr
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Coming to Auction */}
      {upcomingAuctions.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Coming to Auction</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingAuctions.map((auc) => (
              <div key={auc.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{auc.artwork?.title ?? auc.artwork_id}</h4>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Scheduled</span>
                </div>
                <p className="text-xs text-gray-400">{auc.artwork?.artist}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Starting bid</span>
                  <span className="font-semibold">{auc.starting_bid.toLocaleString()} cr</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Starts {new Date(auc.starts_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
