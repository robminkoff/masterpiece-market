"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Auction } from "@/lib/types";

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
  const title = auction.artwork?.title ?? "Unknown Artwork";
  const artist = auction.artwork?.artist ?? "";

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex justify-between items-start">
      <div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${badge}`}>{auction.status}</span>
        <h3 className="font-semibold mt-2">{title}</h3>
        <p className="text-sm text-gray-500">{artist}</p>
        <p className="text-sm mt-1">
          {auction.status === "live"
            ? `Current bid: ${auction.current_bid.toLocaleString()} cr`
            : `Starting bid: ${auction.starting_bid.toLocaleString()} cr`}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {auction.status === "scheduled"
            ? `Starts: ${new Date(auction.starts_at).toLocaleString()}`
            : `Ends: ${new Date(auction.ends_at).toLocaleString()}`}
        </p>
      </div>

      {auction.status === "live" && (
        <Link
          href={`/auction-house/live/${auction.id}`}
          className="bg-[var(--accent-dark)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
        >
          Join
        </Link>
      )}
    </div>
  );
}
