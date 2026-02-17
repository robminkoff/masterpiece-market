"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Auction } from "@/lib/types";
import { TIER_CONFIG } from "@/lib/types";
import { ArtFrame } from "@/components/ArtFrame";

const STATUS_BADGES: Record<string, string> = {
  live: "bg-green-100 text-green-800",
  scheduled: "bg-blue-100 text-blue-800",
  ended: "bg-gray-100 text-gray-600",
  settled: "bg-purple-100 text-purple-800",
};

export default function AuctionHousePage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auctions")
      .then((r) => r.json())
      .then((data) => setAuctions(data.auctions))
      .finally(() => setLoading(false));
  }, []);

  const live = auctions.filter((a) => a.status === "live");
  const upcoming = auctions.filter((a) => a.status === "scheduled");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Auction House</h1>

      {loading ? (
        <p className="text-gray-500">Loading auctions...</p>
      ) : (
        <>
          {/* Live auctions */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Now
            </h2>
            {live.length === 0 ? (
              <p className="text-gray-400 text-sm">No live auctions at the moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {live.map((a) => (
                  <AuctionCard key={a.id} auction={a} />
                ))}
              </div>
            )}
          </section>

          {/* Upcoming */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-gray-400 text-sm">No upcoming auctions scheduled.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map((a) => (
                  <AuctionCard key={a.id} auction={a} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  const badge = STATUS_BADGES[auction.status] ?? STATUS_BADGES.ended;
  const art = auction.artwork;
  const title = art?.title ?? "Unknown Artwork";
  const artist = art?.artist ?? "";
  const tier = art?.tier ?? "D";
  const cfg = TIER_CONFIG[tier];

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      {/* Artwork image */}
      <div className="bg-neutral-100 dark:bg-neutral-900 flex justify-center p-4">
        <ArtFrame
          src={art?.image_url ?? null}
          alt={title}
          tier={tier}
          size="sm"
        />
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${badge}`}>{auction.status}</span>
          <span className="text-xs text-gray-400 font-medium">T{tier} {cfg.label}</span>
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{artist}{art?.year ? `, ${art.year}` : ""}</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">
              {auction.status === "live" ? "Current bid" : "Starting bid"}
            </p>
            <p className="text-lg font-bold">
              {(auction.status === "live" ? auction.current_bid : auction.starting_bid).toLocaleString()} cr
            </p>
          </div>
          {auction.status === "live" ? (
            <Link
              href={`/auction-house/live/${auction.id}`}
              className="bg-[var(--accent-dark)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
            >
              Join
            </Link>
          ) : (
            <p className="text-xs text-gray-400">
              Starts {new Date(auction.starts_at).toLocaleDateString()}
            </p>
          )}
        </div>
        {auction.status === "live" && (
          <p className="text-xs text-gray-400 mt-2">
            {auction.bid_count} bid{auction.bid_count !== 1 ? "s" : ""} · Ends {new Date(auction.ends_at).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
