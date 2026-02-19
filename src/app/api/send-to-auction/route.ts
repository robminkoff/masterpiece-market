import { NextRequest, NextResponse } from "next/server";
import { SendToAuctionSchema } from "@/lib/validators";
import { SEED_ARTWORKS } from "@/data/seed";
import { ownerships, auctions, auctionSubmissions, persistState } from "@/data/store";
import { AUCTION_BACKSTOP_RATE, canResell } from "@/lib/types";
import type { Auction } from "@/lib/types";

// POST /api/send-to-auction — submit artwork to next auction cycle
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = SendToAuctionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { artwork_id, seller_id, auction_type } = parsed.data;

  // Find artwork
  const artwork = SEED_ARTWORKS.find((a) => a.id === artwork_id);
  if (!artwork) {
    return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
  }

  // Find active ownership
  const ownership = ownerships.find(
    (o) => o.artwork_id === artwork_id && o.owner_id === seller_id && o.is_active,
  );
  if (!ownership) {
    return NextResponse.json({ error: "You do not own this artwork" }, { status: 403 });
  }

  // Guards
  if (ownership.on_loan) {
    return NextResponse.json({ error: "Cannot auction while artwork is on loan" }, { status: 400 });
  }
  if (!canResell(ownership.acquired_at)) {
    return NextResponse.json({ error: "24-hour hold period has not elapsed" }, { status: 400 });
  }
  if (auctionSubmissions.includes(artwork_id)) {
    return NextResponse.json({ error: "Artwork is already submitted to auction" }, { status: 400 });
  }

  // Starting bid = backstop floor (30% IV)
  const startingBid = Math.round(artwork.insured_value * AUCTION_BACKSTOP_RATE);

  const now = new Date();
  const startsAt = new Date(now.getTime() + 60 * 60 * 1000); // +1h
  const endsAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2h

  const newAuction: Auction = {
    id: `auc-${Date.now()}`,
    artwork_id,
    seller_id,
    auction_type: auction_type ?? "regular",
    status: "scheduled",
    starting_bid: startingBid,
    reserve_price: null, // forced acceptance
    current_bid: 0,
    current_bidder: null,
    bid_count: 0,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    settled_at: null,
    artwork,
  };

  auctions.push(newAuction);
  auctionSubmissions.push(artwork_id);
  persistState();

  return NextResponse.json({ auction: newAuction }, { status: 201 });
}
