"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { BidPanel } from "@/components/BidPanel";
import { AuctionTimer } from "@/components/AuctionTimer";
import { ArtFrame } from "@/components/ArtFrame";
import type { Artwork } from "@/lib/types";

interface BidEvent {
  bidder_id: string;
  amount: number;
  time: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

export default function LiveAuctionPage() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentBid, setCurrentBid] = useState(0);
  const [bidHistory, setBidHistory] = useState<BidEvent[]>([]);
  const [artworkTitle, setArtworkTitle] = useState("Loading...");
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [endsAt, setEndsAt] = useState(new Date(Date.now() + 3600_000).toISOString());
  const [status, setStatus] = useState("Connecting...");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch the authenticated user's ID
  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile?.id) setCurrentUserId(data.profile.id);
      })
      .catch(() => {});
  }, []);

  // Fetch auction data (includes joined artwork) for the image
  useEffect(() => {
    fetch("/api/auctions")
      .then((r) => r.json())
      .then((data) => {
        const auction = data.auctions?.find((a: { id: string }) => a.id === auctionId);
        if (auction?.artwork) {
          setArtwork(auction.artwork);
          setArtworkTitle(auction.artwork.title);
        }
      });
  }, [auctionId]);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket", "polling"] });

    s.on("connect", () => {
      setConnected(true);
      setStatus("Connected");
      s.emit("auction:join", { auction_id: auctionId });
    });

    s.on("disconnect", () => {
      setConnected(false);
      setStatus("Disconnected");
    });

    s.on("auction:state", (data: { current_bid: number; ends_at: string; title: string; bids: BidEvent[] }) => {
      setCurrentBid(data.current_bid);
      setEndsAt(data.ends_at);
      setArtworkTitle(data.title);
      setBidHistory(data.bids);
    });

    s.on("auction:bid", (data: BidEvent) => {
      setCurrentBid(data.amount);
      setBidHistory((prev) => [data, ...prev]);
    });

    s.on("auction:extended", (data: { ends_at: string }) => {
      setEndsAt(data.ends_at);
    });

    s.on("auction:ended", () => {
      setStatus("Auction ended!");
    });

    s.on("connect_error", () => {
      setStatus("Socket server not available — run the /server to enable live bidding.");
    });

    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [auctionId]);

  const handleBid = useCallback(
    async (amount: number) => {
      // Send via Socket.IO for realtime
      socket?.emit("auction:bid", {
        auction_id: auctionId,
        bidder_id: currentUserId,
        amount,
      });

      // Also POST to API for validation/persistence
      await fetch(`/api/auctions/${auctionId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
    },
    [socket, auctionId, currentUserId],
  );

  return (
    <div>
      <Link href="/auction-house" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← Back to Auction House
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main auction area */}
        <div className="md:col-span-2">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold">{artworkTitle}</h1>
                <p className="text-sm text-gray-400 mt-1">
                  {artwork ? `${artwork.artist}${artwork.year ? `, ${artwork.year}` : ""}` : `Auction #${auctionId}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Time Remaining</div>
                <AuctionTimer endsAt={endsAt} />
              </div>
            </div>

            {/* Artwork display */}
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg flex justify-center p-6 mb-4">
              <ArtFrame
                src={artwork?.image_url ?? null}
                alt={artworkTitle}
                tier={artwork?.tier ?? "D"}
                size="lg"
              />
            </div>

            {/* Current bid display */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 text-center mb-4">
              <div className="text-sm text-gray-500 mb-1">Current Bid</div>
              <div className="text-4xl font-bold">{currentBid.toLocaleString()} cr</div>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2 text-sm mb-4">
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
              {status}
            </div>

            {/* Bid panel */}
            <BidPanel
              currentBid={currentBid}
              minIncrement={currentBid >= 100_000 ? 5000 : currentBid >= 10_000 ? 1000 : 500}
              onBid={handleBid}
              disabled={!connected}
            />
          </div>
        </div>

        {/* Bid history sidebar */}
        <div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Bid History</h3>
            {bidHistory.length === 0 ? (
              <p className="text-sm text-gray-400">No bids yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {bidHistory.map((b, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <span className="text-gray-500 truncate max-w-[120px]">
                      {b.bidder_id === currentUserId ? "You" : b.bidder_id.slice(0, 8)}
                    </span>
                    <span className="font-medium">{b.amount.toLocaleString()} cr</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
